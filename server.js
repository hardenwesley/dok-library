const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, 
        AlignmentType, WidthType, BorderStyle, ShadingType, LevelFormat, PageBreak } = require('docx');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Serve index.html on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== COMPLETE LESSON PROGRESSIONS DATABASE =====
const lessonProgressions = {
  'argument essay': {
    subject: 'ELA',
    dok1: 'Students identify claim, evidence, and reasoning in provided model essays. Annotate texts highlighting thesis statement, supporting details, and counterarguments. Learn and define key vocabulary: thesis, claim, evidence, counterargument, rebuttal.',
    dok2: 'Students organize their own argument using a structured graphic organizer: Claim → 3 pieces of evidence → reasoning connecting each piece to claim. Complete sentence frames: "My position is... because... For example..." Practice writing topic sentences and evidence cards.',
    dok3: 'Students analyze multiple perspectives on a controversial topic. Compare quality of evidence across sources. Evaluate logical fallacies and bias. Write full argument paragraph using CER: Claim (your position), Evidence (specific quotes/data), Reasoning (why evidence proves claim). Address one counterargument.',
    dok4: 'Students write complete position paper (1500+ words) synthesizing 5+ academic sources. Develop sophisticated thesis. Include 4+ body paragraphs with evidence and reasoning. Address multiple counterarguments thoroughly. Revise based on peer feedback. Prepare to defend position in academic debate.'
  },
  'quadratic equations': {
    subject: 'Math',
    dok1: 'Students identify components of quadratic equations: a, b, c coefficients. Distinguish quadratic from linear equations. Solve simple quadratics (x² = 16) by taking square roots. Factor trinomials with teacher modeling (x² + 5x + 6). Use vocabulary: quadratic, coefficient, roots, solutions, factoring.',
    dok2: 'Students solve quadratic equations using multiple methods: factoring, quadratic formula, completing the square, graphing. Choose appropriate method for different equation forms. Connect algebraic solutions to graph (where parabola crosses x-axis). Create visual representations showing relationship between equation form and graph shape.',
    dok3: 'Students compare efficiency of solution methods for different quadratic forms. Analyze discriminant to determine number of real solutions without solving. Evaluate graphical vs. algebraic approaches for different contexts. Explain when each method is most efficient. Solve application problems requiring quadratic setup and interpretation.',
    dok4: 'Students design real-world scenarios modeled by quadratic equations (projectile motion, profit optimization, area constraints). Test models with data. Refine parameters based on constraints. Analyze how changes to coefficients affect solutions and graph. Present solution method choices and justify efficiency. Propose real-world optimization challenge.'
  },
  'photosynthesis': {
    subject: 'Science',
    dok1: 'Students identify inputs (sunlight, water, carbon dioxide) and outputs (glucose, oxygen) of photosynthesis. Label diagram of chloroplast showing thylakoid and stroma. Define vocabulary: photosynthesis, chlorophyll, glucose, ATP, electron transport chain. Match reactants and products to equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.',
    dok2: 'Students create detailed diagrams explaining light-dependent reactions (in thylakoid) and light-independent reactions/Calvin Cycle (in stroma). Explain how light energy converts to chemical energy (ATP, NADPH). Describe role of chlorophyll in absorbing specific wavelengths. Use graphic organizer: Input → Light Reactions → Calvin Cycle → Output.',
    dok3: 'Students analyze how changing light intensity, CO₂ concentration, or temperature affects photosynthesis rate. Compare photosynthesis and cellular respiration, explaining energy flow through both processes. Evaluate data from experiments manipulating photosynthesis variables. Explain why some wavelengths are more efficient than others. Connect structure (thylakoid membranes) to function (electron transport).',
    dok4: 'Students design and conduct experiments testing how specific factors (pH, light color, temperature, nutrient levels) affect photosynthetic rate. Analyze data and propose mechanisms for observed effects. Propose applications: biofuel production optimization, crop yield improvement, or artificial photosynthesis. Present findings with implications for real-world sustainability challenges.'
  },
  'primary source analysis': {
    subject: 'History',
    dok1: 'Students identify source type (letter, diary, newspaper, speech, photograph, artifact). Record creator, date, origin, audience, and stated purpose. Answer who/what/when/where/why questions. Distinguish between primary and secondary sources. Annotate for unfamiliar terms and basic meaning.',
    dok2: 'Students explain how historical context shaped source creation. Identify main message or perspective. Categorize source type and explain limitations. Use source to answer basic historical questions. Create graphic organizer: Source Info → Creator Perspective → Time Period Context → Main Message → Purpose.',
    dok3: 'Students compare multiple primary sources on same event, analyzing conflicting accounts. Identify bias and point of view. Evaluate reliability based on creator, audience, context. Analyze use of language, tone, imagery. Support interpretations with specific textual evidence. Explain how different sources reveal different perspectives on same historical moment.',
    dok4: 'Students synthesize 5+ primary sources into a historical argument about complex event or issue. Address conflicting accounts by evaluating source credibility and context. Write position paper supported by primary source evidence. Acknowledge limitations of available sources. Propose how additional sources might change understanding. Present oral defense of interpretation.'
  },
  'essay writing': {
    subject: 'ELA',
    dok1: 'Students identify essay components: introduction with hook and thesis, body paragraphs with topic sentences and supporting details, conclusion that restates thesis. Read and annotate model essays, highlighting these components. Practice writing strong thesis statements. Define academic vocabulary: thesis, topic sentence, evidence, concluding sentence.',
    dok2: 'Students write 5-paragraph essay with clear thesis and supporting paragraphs. Provide 2-3 pieces of evidence per paragraph. Write topic sentences introducing main idea of each paragraph. Connect sentences within paragraphs logically. Use transition words and phrases. Include concluding paragraph that summarizes main points without simply repeating.',
    dok3: 'Students write multiparagraph essay (6+ paragraphs) with sophisticated thesis. Develop complex ideas across multiple paragraphs. Evaluate strength of evidence and select most compelling support. Use varied sentence structures and academic vocabulary. Incorporate sources and citations. Address potential counterarguments. Demonstrate clear organization and smooth transitions throughout essay.',
    dok4: 'Students write research essay (2000+ words) synthesizing multiple sources into original argument. Develop nuanced thesis addressing complexity of topic. Integrate and analyze quotations. Properly cite sources in required format. Revise based on feedback for clarity, coherence, and persuasiveness. Prepare to present findings and defend argument against critique.'
  },
  'word problems': {
    subject: 'Math',
    dok1: 'Students identify what the problem is asking and what information is given. Highlight or underline key numbers and operation words (total, difference, each, per). Translate words to equations with teacher modeling. Solve simple one-step word problems. Check that answer makes sense in context.',
    dok2: 'Students solve multi-step word problems involving two or more operations. Organize information (What do I know? What do I need to find? What operation applies?). Create visual representation (diagram, table, chart) matching problem. Write equation and solve. Interpret answer in context and check reasonableness.',
    dok3: 'Students solve complex word problems requiring interpretation of relationships. Compare different solution strategies and evaluate efficiency. Justify choice of operation and solution method with reasoning. Identify irrelevant information. Analyze problems with multiple valid interpretations. Explain how changing conditions affects solution.',
    dok4: 'Students design real-world problems requiring multi-step solution. Collect and analyze data for authentic scenarios. Test mathematical models against real data. Optimize solutions given constraints. Present problem-solving process and justify methodology. Propose variations on problem with different parameters.'
  },
  'reading comprehension': {
    subject: 'ELA',
    dok1: 'Students answer literal comprehension questions about text (who, what, when, where). Identify main idea of passage. Find specific details supporting main idea. Define vocabulary in context. Sequence events in chronological order. Recall key facts from reading.',
    dok2: 'Students explain relationships between characters, events, and ideas. Describe cause-and-effect relationships in text. Compare and contrast characters, settings, themes. Infer implied meanings from clues in text. Explain author\'s purpose. Summarize main ideas and supporting details in own words.',
    dok3: 'Students analyze author\'s development of theme across text. Evaluate credibility of arguments and evidence presented. Analyze how word choice, imagery, and figurative language create meaning. Interpret symbols and their significance. Compare themes across multiple texts. Draw conclusions about author\'s perspective and bias.',
    dok4: 'Students synthesize ideas from multiple complex texts. Evaluate author\'s argument comprehensively, identifying strengths and weaknesses. Analyze how text connects to broader historical, cultural, or philosophical contexts. Apply concepts from reading to new situations. Propose interpretations supported by textual evidence. Create original analysis of text\'s relevance today.'
  },
  'goal setting': {
    subject: 'Academic Advisory',
    dok1: 'Students identify short-term (weekly/monthly) and long-term (yearly) goals. Write specific, measurable goals using SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound). List obstacles and resources. Track progress weekly. Celebrate achieved goals.',
    dok2: 'Students develop goal-setting plan including specific strategies to reach each goal. Break long-term goal into milestones. Create action steps with target dates. Identify support systems and accountability partners. Monitor progress and adjust strategies as needed.',
    dok3: 'Students analyze what obstacles prevented goal achievement and adjust approach. Evaluate goal-setting process for effectiveness. Set goals reflecting 7 Mindsets (Courage, Collaboration, Integrity, etc.). Connect personal goals to academic and career aspirations. Seek feedback on goal progress and respond to guidance.',
    dok4: 'Students design comprehensive 4-year academic and career plan with interconnected goals. Regularly assess alignment between goals and evolving interests. Create accountability system with mentors/advisors. Demonstrate persistence through setbacks by revising strategy. Present growth trajectory showing how goals have evolved.'
  },
  'mindsets': {
    subject: 'Academic Advisory',
    dok1: 'Students identify and define the 7 Mindsets: Courage, Collaboration, Integrity, Exploration, Growth, Ownership, Curiosity. Give examples of each mindset in daily life. Identify situations where each mindset is needed.',
    dok2: 'Students explain how each mindset supports learning and relationships. Describe their own mindset strengths and growth areas. Apply mindsets to academic challenges. Identify mindset needed for specific situation (group project, difficult assignment, conflict).',
    dok3: 'Students analyze obstacles to demonstrating mindsets. Evaluate how mindset shifts impact behavior and outcomes. Compare their mindset in different contexts (class, sport, family). Design strategies to strengthen specific mindsets in areas of struggle.',
    dok4: 'Students create personal mindset plan reflecting on identity and values. Demonstrate sustained practice of multiple mindsets over time. Mentor peers in developing stronger mindsets. Design solution to community problem requiring collaborative, courageous, integrity-based approach.'
  },
  'vocabulary': {
    subject: 'ELD',
    dok1: 'Students identify and define academic vocabulary words. Use context clues to determine word meanings. Match words to definitions. Create word cards with word, definition, example, illustration. Participate in vocabulary review games.',
    dok2: 'Students use academic vocabulary in oral and written contexts. Explain how word choice affects meaning. Use word families and morphology (prefixes, suffixes, roots) to understand related words. Create sentences demonstrating understanding of academic words in context.',
    dok3: 'Students analyze nuanced vocabulary differences (synonyms with different connotations). Explain how academic vocabulary differs from conversational language. Evaluate author\'s word choices for effect. Use disciplinary-specific vocabulary accurately and purposefully.',
    dok4: 'Students develop personal academic vocabulary notebooks organized by discipline. Apply sophisticated vocabulary in presentations and writing. Teach vocabulary to peers. Create resources (glossaries, word walls) supporting vocabulary development in classroom.'
  }
};

// ===== ASSESSMENT TEMPLATES =====
const assessmentTemplates = {
  'a1': generateRecallRubric(),
  'a2': generateApplicationTemplate(),
  'a3': generateStrategicThinkingRubric(),
  'a4': generateExemplarTemplate(),
  'a5': generateCapstoneRubric(),
  'a6': generateProjectProposal()
};

function generateRecallRubric() {
  return {
    title: 'DOK 1 Recall Rubric',
    children: [
      new Paragraph({ text: 'DOK 1 Recall & Reproduction Rubric', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
      new Paragraph({ text: 'Student: ________________________     Date: _____________________', spacing: { after: 100 } }),
      new Paragraph({ text: '', spacing: { after: 200 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Criteria')], shading: { fill: 'D5E8F0', type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph('Excellent (4)')], shading: { fill: 'D5E8F0', type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph('Proficient (3)')], shading: { fill: 'D5E8F0', type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph('Developing (2)')], shading: { fill: 'D5E8F0', type: ShadingType.CLEAR } }),
              new TableCell({ children: [new Paragraph('Beginning (1)')], shading: { fill: 'D5E8F0', type: ShadingType.CLEAR } })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Identifies/Recalls Information')] }),
              new TableCell({ children: [new Paragraph('Identifies all key information accurately and completely')] }),
              new TableCell({ children: [new Paragraph('Identifies most information accurately')] }),
              new TableCell({ children: [new Paragraph('Identifies some information with minor errors')] }),
              new TableCell({ children: [new Paragraph('Minimal or inaccurate identification')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Defines Key Terms')] }),
              new TableCell({ children: [new Paragraph('Clear, precise definitions in own words')] }),
              new TableCell({ children: [new Paragraph('Mostly accurate definitions with clarity')] }),
              new TableCell({ children: [new Paragraph('Partial definitions or some lack of clarity')] }),
              new TableCell({ children: [new Paragraph('Inaccurate or missing definitions')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Completes Routine Procedures')] }),
              new TableCell({ children: [new Paragraph('Correctly completes all steps in order')] }),
              new TableCell({ children: [new Paragraph('Completes most steps correctly')] }),
              new TableCell({ children: [new Paragraph('Several errors in process or sequence')] }),
              new TableCell({ children: [new Paragraph('Incomplete or mostly incorrect')] })
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 200 } }),
      new Paragraph({ text: 'TOTAL SCORE: ____/12', spacing: { after: 100 } }),
      new Paragraph({ text: 'TEACHER NOTES:', spacing: { after: 100 } }),
      new Paragraph({ text: '______________________________________________________________________' })
    ]
  };
}

function generateApplicationTemplate() {
  return {
    title: 'DOK 2 Application Template',
    children: [
      new Paragraph({ text: 'DOK 2 Application Assignment', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
      new Paragraph({ text: 'Name: ________________________     Date: _____________________', spacing: { after: 100 } }),
      new Paragraph({ text: 'Subject: ________________________     Topic: _____________________', spacing: { after: 300 } }),
      
      new Paragraph({ text: 'PART 1: WHAT DO I KNOW?', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'What background knowledge or information do you already have about this topic?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'PART 2: WHAT STRATEGY WILL I USE?', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'What method or strategy will you use to solve this problem or complete this task?', spacing: { after: 50 } }),
      new Paragraph({ text: 'Strategy: ___________________________________________________________', spacing: { after: 100 } }),
      new Paragraph({ text: 'Why did you choose this strategy?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'PART 3: APPLY & EXPLAIN', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'Solve the problem or complete the task. Show your work.', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 100 } }),
      new Paragraph({ text: 'Explain your thinking using complete sentences:', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'PART 4: CHECK YOUR WORK', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'Does your answer make sense? Why or why not?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'REFLECTION', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'What was challenging about this task?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 100 } }),
      new Paragraph({ text: 'What do you still need to learn or practice?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________' })
    ]
  };
}

function generateStrategicThinkingRubric() {
  return {
    title: 'DOK 3 Strategic Thinking Rubric',
    children: [
      new Paragraph({ text: 'DOK 3 Strategic Thinking Rubric', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
      new Paragraph({ text: 'Student: ________________________     Date: _____________________', spacing: { after: 300 } }),
      
      new Paragraph({ text: 'CLAIM — Does the student state a clear position or conclusion?', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Clear, specific, compelling claim (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Clear claim but could be more specific (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Vague or partially clear claim (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Missing or unclear claim (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'EVIDENCE — Does the student support with relevant, credible evidence?', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Multiple specific, well-chosen pieces of evidence (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Relevant evidence clearly provided (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Some evidence, but weak or limited (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Little or no supporting evidence (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'REASONING — Why does the evidence support the claim?', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Clear, sophisticated explanation of reasoning (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Clear reasoning is shown (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Basic reasoning attempts (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Missing or confused reasoning (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'ANALYSIS — Deeper thinking and complexity of thought', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Synthesizes and integrates multiple ideas (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Analyzes thoughtfully (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Makes some connections (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Surface-level thinking only (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'TOTAL SCORE: ____/16', spacing: { after: 100 } }),
      new Paragraph({ text: 'TEACHER FEEDBACK:', spacing: { after: 100 } }),
      new Paragraph({ text: '_________________________________________________________________' })
    ]
  };
}

function generateExemplarTemplate() {
  return {
    title: 'Student Exemplar: DOK 3 Analysis Essay',
    children: [
      new Paragraph({ text: 'DOK 3 Analysis Essay Exemplar', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
      new Paragraph({ text: 'This exemplar demonstrates the following characteristics of strong DOK 3 work:', spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Clear thesis statement that makes a specific claim')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Multiple body paragraphs with topic sentences')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Substantial evidence supporting each main point')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Analysis explaining how evidence supports the claim')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Acknowledgment of counterarguments')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Proper citations of sources')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'SAMPLE ESSAY STRUCTURE:', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Introduction paragraph with hook, context, and clear thesis')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Body paragraph 1: Topic sentence + 2-3 pieces of evidence + analysis')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Body paragraph 2: Topic sentence + 2-3 pieces of evidence + analysis')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Body paragraph 3: Topic sentence + 2-3 pieces of evidence + analysis')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Counterargument paragraph: Acknowledges opposing view + refutation')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Conclusion: Restates thesis, summarizes main points, discusses implications')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'CHARACTERISTICS OF ANALYSIS (DOK 3):', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Student explains WHY the evidence matters, not just WHAT it says')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Student makes connections between ideas')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Student evaluates the strength of arguments')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Student uses sophisticated vocabulary and varied sentence structures')] })
    ]
  };
}

function generateCapstoneRubric() {
  return {
    title: 'DOK 4 Extended Thinking Capstone Rubric',
    children: [
      new Paragraph({ text: 'DOK 4 Extended Thinking Capstone Rubric', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
      new Paragraph({ text: 'Student: ________________________     Project: _____________________', spacing: { after: 300 } }),
      
      new Paragraph({ text: 'DESIGN/CREATION — Originality, execution quality, feasibility', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Highly innovative design, polished execution (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Creative design, mostly well-executed (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Shows effort and some execution quality (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Limited originality or poor execution (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'SYNTHESIS — Integration of multiple sources and ideas', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Seamlessly integrates multiple ideas into coherent whole (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Clearly synthesizes main ideas from sources (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Attempts to connect ideas (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Limited synthesis (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'REAL-WORLD APPLICATION — Relevance and justification', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Highly applicable, persuasively justified (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Applicable with good justification (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Somewhat applicable (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Unclear or limited application (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'ITERATION/REFINEMENT — Evidence of growth through cycles', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Multiple revisions showing clear improvement (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Revisions show improvement (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Some revision, minimal improvement (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ No revision or minimal effort (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'REFLECTION — Articulation of learning and next steps', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Insightful reflection on process and growth (4)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Clear reflection on what was learned (3)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Basic reflection (2)')] }),
      new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('☐ Missing or superficial reflection (1)')], spacing: { after: 200 } }),
      
      new Paragraph({ text: 'TOTAL SCORE: ____/20', spacing: { after: 100 } }),
      new Paragraph({ text: 'TEACHER FEEDBACK:', spacing: { after: 100 } }),
      new Paragraph({ text: '_________________________________________________________________' })
    ]
  };
}

function generateProjectProposal() {
  return {
    title: 'DOK 4 Capstone Project Proposal',
    children: [
      new Paragraph({ text: 'DOK 4 Capstone Project Proposal', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
      new Paragraph({ text: 'Name: ________________________     Date: _____________________', spacing: { after: 300 } }),
      
      new Paragraph({ text: 'PROJECT OVERVIEW', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'What real-world problem are you addressing, or what will you create/design?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'RESEARCH & SYNTHESIS', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'List 5-7 credible sources you will draw from to inform your project:', spacing: { after: 100 } }),
      new Paragraph({ text: '1. ________________________________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: '2. ________________________________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: '3. ________________________________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: '4. ________________________________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: '5. ________________________________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: '6. ________________________________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: '7. ________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'YOUR DESIGN/APPROACH', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'Describe your plan in detail. What will you create, design, or build?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'MILESTONES & TIMELINE', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'Milestone 1 (Due: _______): ______________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: 'Milestone 2 (Due: _______): ______________________________________________', spacing: { after: 50 } }),
      new Paragraph({ text: 'Milestone 3 (Due: _______): ______________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'FEEDBACK & ITERATION', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'How will you get feedback? How will you refine your project based on that feedback?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'FINAL DELIVERABLE', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'How will you present/share your work? (Essay, presentation, prototype, etc.)', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________', spacing: { after: 200 } }),
      
      new Paragraph({ text: 'REFLECTION', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: 'Why does this matter? What will you learn? How does it connect to the unit?', spacing: { after: 50 } }),
      new Paragraph({ text: '_________________________________________________________________' })
    ]
  };
}

// ===== API ENDPOINTS =====
app.post('/api/get-lesson', async (req, res) => {
  const { subject, topic } = req.body;
  
  let progression = null;
  const topicLower = topic.toLowerCase().trim();
  
  // Find matching progression
  for (const [key, value] of Object.entries(lessonProgressions)) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      progression = { ...value, topic };
      break;
    }
  }
  
  if (!progression) {
    return res.json({ 
      topic,
      subject,
      dok1: 'Students recall/identify key concepts, vocabulary, and basic facts.',
      dok2: 'Students apply knowledge to solve problems or explain relationships.',
      dok3: 'Students analyze, compare, and justify conclusions using evidence.',
      dok4: 'Students design, synthesize, and apply learning to real-world contexts.'
    });
  }
  
  res.json(progression);
});

app.post('/api/download-lesson', async (req, res) => {
  const { subject, topic, grade, delivery, dok1, dok2, dok3, dok4 } = req.body;
  
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ text: topic, heading: HeadingLevel.HEADING_1, spacing: { after: 100 } }),
        new Paragraph({ text: `${subject} | Grade: ${grade} | Delivery: ${delivery}`, spacing: { after: 300 } }),
        
        new Paragraph({ text: 'DOK 1: RECALL & REPRODUCTION', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
        new Paragraph({ text: 'Students identify, define, recall facts, or complete routine procedures.', spacing: { after: 100 } }),
        new Paragraph({ text: dok1 || '[Teacher input: Describe DOK 1 activity]', spacing: { after: 300 } }),
        
        new Paragraph({ text: 'DOK 2: SKILL & CONCEPT', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
        new Paragraph({ text: 'Students apply knowledge, organize information, and explain their thinking.', spacing: { after: 100 } }),
        new Paragraph({ text: dok2 || '[Teacher input: Describe DOK 2 activity]', spacing: { after: 300 } }),
        
        new Paragraph({ text: 'DOK 3: STRATEGIC THINKING', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
        new Paragraph({ text: 'Students reason, argue, analyze, and justify across multiple sources or perspectives.', spacing: { after: 100 } }),
        new Paragraph({ text: dok3 || '[Teacher input: Describe DOK 3 activity]', spacing: { after: 300 } }),
        
        new Paragraph({ text: 'DOK 4: EXTENDED THINKING', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
        new Paragraph({ text: 'Students design, synthesize, and apply knowledge in real-world contexts over time.', spacing: { after: 100 } }),
        new Paragraph({ text: dok4 || '[Teacher input: Describe DOK 4 activity]', spacing: { after: 300 } }),
        
        new Paragraph({ text: 'Engageli Integration Tips', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Use Engageli polls and annotations for DOK 1 recall checks')] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Use breakout rooms for DOK 2 small-group application work')] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Use Think-Pair-Share or Jigsaws for DOK 3 collaborative reasoning')] }),
        new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun('Use milestone checkpoints in Canvas for DOK 4 capstone projects')] })
      ]
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${topic.replace(/\s+/g, '_')}_Lesson_Plan.docx"`);
  res.send(buffer);
});

app.post('/api/download-assessment', async (req, res) => {
  const { id, title } = req.body;
  const template = assessmentTemplates[id];
  
  if (!template) {
    return res.status(404).json({ error: 'Assessment not found' });
  }
  
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: template.children
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.docx"`);
  res.send(buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DOK Library server running on http://localhost:${PORT}`);
  console.log(`Access from this computer: http://127.0.0.1:${PORT}`);
  console.log(`Access from your network: http://21.4.0.32:${PORT}`);
});
