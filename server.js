const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, 
        AlignmentType, WidthType, BorderStyle, ShadingType } = require('docx');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const client = new Anthropic();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== INTELLIGENT LESSON GENERATION =====
app.post('/api/generate-lesson', async (req, res) => {
  const { topic, grade, delivery, allScaffolds } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic required' });
  }

  try {
    // Generate lesson plan using Claude
    const scaffoldList = allScaffolds
      .slice(0, 30)
      .map(s => `- ${s.title} (DOK ${s.dok}, ${s.subject})`)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert curriculum designer for virtual high schools. Generate a detailed, actionable lesson plan for:

TOPIC: ${topic}
GRADE LEVEL: ${grade}
DELIVERY METHOD: ${delivery}

Available scaffolds to reference:
${scaffoldList}

Return a JSON object with exactly this structure (no markdown, just raw JSON):
{
  "topic": "exact topic from input",
  "overview": "2-3 sentence overview of the lesson",
  "estimatedDuration": "e.g., '2-3 class periods' or '1 week'",
  "keyFocus": "main learning objective",
  "dok1": {
    "focus": "what students will recall/understand",
    "activities": "specific activities for DOK 1",
    "full": "detailed DOK 1 lesson content (3-4 paragraphs)"
  },
  "dok2": {
    "focus": "what students will apply/practice",
    "activities": "specific activities for DOK 2",
    "full": "detailed DOK 2 lesson content (3-4 paragraphs)"
  },
  "dok3": {
    "focus": "what students will analyze/evaluate",
    "activities": "specific activities for DOK 3",
    "full": "detailed DOK 3 lesson content (3-4 paragraphs)"
  },
  "dok4": {
    "focus": "what students will create/synthesize",
    "activities": "specific activities for DOK 4",
    "full": "detailed DOK 4 lesson content (3-4 paragraphs)"
  },
  "considerations": [
    "Consideration 1 for virtual delivery",
    "Consideration 2 about differentiation",
    "Consideration 3 about assessment",
    "Consideration 4 about technology",
    "Consideration 5 about engagement"
  ],
  "recommendedScaffoldIds": ["s1", "s5", "s12", "s15", "s22", "s35"]
}

Make sure all activities are 100% virtual-friendly (Engageli synchronous and/or Canvas asynchronous).`
        }
      ]
    });

    // Extract JSON from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Try to parse JSON
    let lessonData;
    try {
      lessonData = JSON.parse(responseText);
    } catch (e) {
      // If direct parse fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessonData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from response');
      }
    }

    res.json(lessonData);

  } catch (error) {
    console.error('Lesson generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate lesson' });
  }
});

// ===== DOWNLOAD LESSON PLAN AS DOCX =====
app.post('/api/download-lesson', async (req, res) => {
  const { topic, grade, delivery, duration, dok1, dok2, dok3, dok4, overview, keyFocus } = req.body;

  try {
    const sections = [];

    // Title
    sections.push(
      new Paragraph({
        text: `Lesson Plan: ${topic}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );

    // Metadata
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph({ text: 'Grade Level:', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: grade || 'Grades 9-12' })] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph({ text: 'Delivery Method:', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: delivery || 'Hybrid' })] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph({ text: 'Duration:', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: duration || 'Flexible' })] })
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );

    // Overview
    if (overview) {
      sections.push(
        new Paragraph({
          text: 'Overview',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: overview,
          spacing: { after: 400 }
        })
      );
    }

    // DOK Levels
    const dokLevels = [
      { number: '1', title: 'Recall & Reproduction', content: dok1 },
      { number: '2', title: 'Skill & Concept', content: dok2 },
      { number: '3', title: 'Strategic Thinking', content: dok3 },
      { number: '4', title: 'Extended Thinking', content: dok4 }
    ];

    dokLevels.forEach((level, index) => {
      sections.push(
        new Paragraph({
          text: `DOK Level ${level.number}: ${level.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: level.content || 'No content provided',
          spacing: { after: 400 }
        })
      );

      if (index < dokLevels.length - 1) {
        sections.push(new Paragraph({ text: '' }));
      }
    });

    // Generate document
    const doc = new Document({
      sections: [{
        children: sections
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${topic.replace(/\s+/g, '_')}_Lesson_Plan.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

// ===== DOWNLOAD ASSESSMENT TEMPLATE =====
app.post('/api/download-assessment', async (req, res) => {
  const { id, title } = req.body;

  try {
    const sections = [];

    sections.push(
      new Paragraph({
        text: `Assessment: ${title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );

    sections.push(
      new Paragraph({
        text: 'Instructions: Complete the rubric below to assess student work.',
        italic: true,
        spacing: { after: 400 }
      })
    );

    // Rubric table
    const rubricTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cells: [
            new TableCell({ children: [new Paragraph({ text: 'Criteria', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Developing', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Proficient', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Advanced', bold: true })] })
          ]
        }),
        ...['Criteria 1', 'Criteria 2', 'Criteria 3'].map(c =>
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph({ text: c })] }),
              new TableCell({ children: [new Paragraph({ text: '' })] }),
              new TableCell({ children: [new Paragraph({ text: '' })] }),
              new TableCell({ children: [new Paragraph({ text: '' })] })
            ]
          })
        )
      ]
    });

    sections.push(rubricTable);

    const doc = new Document({
      sections: [{
        children: sections
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_Assessment.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Assessment download error:', error);
    res.status(500).json({ error: 'Failed to generate assessment' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 DOK Library running on http://localhost:${PORT}`);
});
