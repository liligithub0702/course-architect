/* ============================================================
   Course content — Module 21
   Communication: Evolution of Telecommunications
   Built from the Sutherland Connected Services training outline.
   Exposes window.buildModule21Course() used by defaultCourse().
   ============================================================ */
(function () {
  function id(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }

  function heading(text, eyebrow, level) {
    return { id: id('b'), type: 'heading', level: level || 'h2', text, eyebrow: eyebrow || '' };
  }
  function text(html) { return { id: id('b'), type: 'text', html }; }
  function callout(label, title, body, accent) {
    return { id: id('b'), type: 'statement', variant: 'callout', accent: accent || 'blue', label: label || 'Note', title: title || '', text: body || '' };
  }
  function quote(body, accent) {
    return { id: id('b'), type: 'statement', variant: 'quote', accent: accent || 'blue', label: '', title: '', text: body || '' };
  }
  function divider() { return { id: id('b'), type: 'divider', style: 'line' }; }
  function tabs(items) {
    return { id: id('b'), type: 'tabs', items: items.map(it => ({ id: id('t'), label: it.label, html: it.html })) };
  }
  function accordion(items, accent) {
    return { id: id('b'), type: 'accordion', accent: accent || 'blue', items: items.map(it => ({ id: id('a'), title: it.title, sub: it.sub || '', html: it.html })) };
  }
  function flip(cards) {
    return { id: id('b'), type: 'flip', cards: cards.map(c => ({ id: id('c'), accent: c.accent, icon: c.icon || 'layers', kicker: c.kicker || '', front: c.front, back: c.back })) };
  }
  function mcq(question, options, correctIndex, graded) {
    const opts = options.map(o => ({ id: id('o'), text: o.text, feedback: o.feedback }));
    return { id: id('b'), type: 'mcq', question, graded: graded !== false,
      options: opts, correct: correctIndex == null ? null : opts[correctIndex].id };
  }
  function section(title) { return { id: id('l'), kind: 'section', title, blocks: [] }; }
  function lesson(title, blocks) { return { id: id('l'), kind: 'lesson', title, blocks }; }

  window.buildModule21Course = function () {
    return {
      meta: {
        title: 'Evolution of Telecommunications',
        subtitle: 'Every contact you handle is the end point of an industry that has been evolving for over 170 years. This module traces that journey \u2014 from the telegraph to 5G \u2014 and shows how industry knowledge makes every customer interaction more confident and more accurate.',
        kicker: 'Module 21 \u00b7 Communications Vertical \u00b7 Phase 4: Specialise',
        cover: '',
        accent: 'indigo',
        facts: [
          { k: 'Delivery', v: 'Facilitated / Self-paced' },
          { k: 'Duration', v: '60 minutes' },
          { k: 'Competency', v: 'Domain Knowledge' },
          { k: 'Stage', v: 'Understand' },
        ],
      },
      lessons: [

        /* ============== SECTION: START HERE ============== */
        section('Start here'),

        lesson('Why this module matters', [
          heading('Why this module matters', 'Context'),
          text('Every contact you handle is the end point of an industry that has been evolving for over 170 years. A customer calling about their mobile data plan, their streaming service, or their smart home device is reaching you through a system that began with a single telegraph wire and grew into a global network of fibre-optic cables, cell towers, satellites, and software-defined infrastructure.'),
          text('Understanding that history \u2014 and the structure and challenges of the industry today \u2014 gives you context that makes every interaction more meaningful. When a customer asks why their 5G speeds are not what they expected, why their bill changed after a promotion, or why their smart home device lost connection, the answer exists somewhere within the telecommunications ecosystem. Agents who understand the ecosystem give more informed, more confident responses.'),
          callout('Where this fits', 'The foundation for the Communications vertical', 'This is the first of the Domain Specific modules in the Communications vertical. It establishes the industry foundation that the more technical modules build on.', 'indigo'),
          heading('What industry knowledge changes', 'The difference it makes', 'h3'),
          tabs([
            { label: 'What knowledge enables', html: '<ul><li>Agents can explain service limitations, network behaviours, and technology changes with <strong>accuracy and confidence</strong>.</li><li>Context for why services are priced, structured, or limited the way they are becomes clear and explainable.</li><li>Agents understand the pace of change in the industry and can frame customer expectations about new technologies realistically.</li><li>The industry landscape gives meaning to company strategy, product decisions, and service boundaries.</li></ul>' },
            { label: 'What\u2019s harder without it', html: '<ul><li>Technical customer questions receive vague or inconsistent answers that reduce customer trust.</li><li>Billing and plan conversations lack the background that helps customers understand their situation.</li><li>Promises about new features or coverage get made without the industry awareness to back them up.</li><li>Individual policies and features feel arbitrary rather than connected to a broader business reality.</li></ul>' },
          ]),
        ]),

        lesson('What you\u2019ll be able to do', [
          heading('Learning objectives', 'Objectives'),
          text('By the end of this module, you will be able to:'),
          accordion([
            { title: '01 \u00b7 Remember \u2014 Identify key historical milestones', html: 'Identify the key historical milestones in telecommunications, from the telegraph to 5G, and place them in chronological sequence.' },
            { title: '02 \u00b7 Understand \u2014 Explain the two core sectors', html: 'Explain how the two core sectors of the telecommunications industry \u2014 equipment and services \u2014 work together to deliver connectivity to consumers and businesses.' },
            { title: '03 \u00b7 Understand \u2014 Describe today\u2019s major challenges', html: 'Describe the major challenges facing the telecommunications industry today, including disruptive competition, cost control, network investment, and 5G uncertainty.' },
            { title: '04 \u00b7 Understand \u2014 Explain digital transformation', html: 'Explain how digital transformation and smart city technologies are reshaping the customer experience and the role of telecom companies.' },
            { title: '05 \u00b7 Apply \u2014 Classify customer scenarios', html: 'Classify a described customer contact or service scenario into the correct telecommunications sector or era, and explain the industry context that makes it relevant.' },
          ], 'indigo'),
          callout('Module facts', '', '<strong>Delivery</strong> Facilitated / self-paced &nbsp;\u00b7&nbsp; <strong>Duration</strong> 60 minutes &nbsp;\u00b7&nbsp; <strong>Competency</strong> Domain Knowledge &nbsp;\u00b7&nbsp; <strong>Stage</strong> Understand', 'slate'),
        ]),

        /* ============== SECTION: CORE KNOWLEDGE ============== */
        section('Core knowledge'),

        lesson('From telegraph to 5G', [
          heading('The history of telecommunications', 'Objective 01'),
          text('The telecommunications industry did not arrive fully formed. It evolved through a series of distinct technological breakthroughs, each one building on the last and reshaping how people and businesses communicated. Understanding this progression explains why the industry looks the way it does today \u2014 and why it continues to change at pace.'),
          accordion([
            { title: '1830s \u00b7 Electric Telegraph', html: 'Samuel Morse\u2019s invention of the electric telegraph enabled messages to be sent over long distances using electrical signals. It was the first technology to <strong>separate communication from physical travel</strong>, laying the foundation for everything that followed.' },
            { title: '1876 \u00b7 Telephone', html: 'Alexander Graham Bell\u2019s telephone enabled voice communication over long distances, transforming personal and business communication. The telephone rapidly became essential infrastructure for modern society.' },
            { title: 'Early 1900s \u00b7 Radio Technology', html: 'Wireless communication through radio expanded the reach of telecommunications beyond fixed wire connections, enabling broadcast communication to large audiences and mobile communication across distance.' },
            { title: '1956 \u00b7 Transatlantic Cable', html: 'The first transatlantic telephone cable enabled direct voice communication between North America and Europe, making international connectivity a practical reality for the first time.' },
            { title: '1960s\u20131970s \u00b7 Satellite and Digital', html: 'Satellite communications provided a new way to transmit signals over vast distances without physical cables. At the same time, digital technology began replacing analog systems \u2014 improving efficiency, quality, and capacity.' },
            { title: '1980s \u00b7 Mobile Networks', html: 'The first commercial cellular network launched, making mobile communication accessible to consumers. For the first time, connectivity was no longer tied to a fixed location.' },
            { title: '1990s \u00b7 The Internet', html: 'The rise of the internet transformed telecommunications from primarily a <em>voice</em> medium to a <em>data</em> medium. Email, instant messaging, and video communication became possible, creating entirely new categories of service.' },
            { title: 'Late 1990s\u20132000s \u00b7 Fibre Optic and Broadband', html: 'Fibre optic technology dramatically increased the speed and capacity of data transmission, enabling high-speed internet and supporting the growth of the digital economy.' },
            { title: '2000s\u20132010s \u00b7 Smartphones and 4G', html: 'The proliferation of smartphones combined with 4G networks made mobile internet an everyday reality. Streaming video, social media, and app-based services became central to consumer life.' },
            { title: '2020s onward \u00b7 5G and IoT', html: '5G networks offer faster speeds, lower latency, and the ability to support far more simultaneous devices. Combined with the Internet of Things, 5G is enabling smart cities, connected infrastructure, and new categories of business-to-business services.' },
          ], 'blue'),
          heading('How the timeline connects to a customer contact', 'Worked example', 'h3'),
          text('A customer calls about their 5G data speeds, disappointed they are not experiencing the speeds they expected. An agent with industry context understands that <strong>5G rollout is uneven</strong>: coverage depends on the density of local infrastructure, and in many areas devices connect to a 5G signal that is still routed through older network architecture. This is not a billing error or a product failure \u2014 it is a stage in a long technological progression that has always moved from early adoption to broad availability over time.'),
          quote('\u201CThe 5G network is still expanding in your area. Here is what you can expect as coverage improves, and here is what is available to you right now.\u201D', 'blue'),
          text('That explanation is only possible when the agent understands where 5G sits in the industry\u2019s timeline \u2014 not just what the product documentation says about speeds.'),
        ]),

        lesson('The two core sectors', [
          heading('Equipment and services', 'Objective 02'),
          text('The telecommunications industry operates through two interdependent sectors. Neither can function effectively without the other. Understanding how they work together clarifies how connectivity is delivered and maintained \u2014 and why certain customer issues trace back to infrastructure rather than to account or billing systems.'),
          tabs([
            { label: 'Equipment sector', html: '<p>The equipment sector provides the <strong>physical and technical infrastructure</strong> that makes communication possible. It includes wired hardware (fibre-optic cables, copper lines) and wireless infrastructure (cell towers, satellite systems, wireless transmission equipment). It is organised into three network layers:</p><ul><li><strong>Core network</strong> \u2014 carries aggregated traffic between major urban centres and across the globe.</li><li><strong>Metropolitan area network (MAN)</strong> \u2014 serves regional needs, connecting large businesses, campuses, and data centres.</li><li><strong>Access network</strong> \u2014 covers the &ldquo;last mile&rdquo;, connecting individual homes and small businesses to the broader network.</li></ul>' },
            { label: 'Services sector', html: '<p>The services sector delivers communication capabilities to consumers and businesses by building and maintaining the infrastructure the equipment sector provides. It covers wireline, wireless, and broadband services and generates approximately <strong>70% of total industry revenue</strong>. Key service types include:</p><ul><li><strong>Voice services</strong> \u2014 calls, VoIP</li><li><strong>Data services</strong> \u2014 internet access, data plans</li><li><strong>Broadband services</strong> \u2014 fibre, cable, DSL</li><li><strong>Content &amp; media services</strong> \u2014 streaming, TV</li><li><strong>Business services</strong> \u2014 cloud, VPN, managed networks</li></ul>' },
          ]),
          callout('Why this matters for contacts', 'Knowing which sector a problem belongs to', '<ul><li>Slow internet speeds may sit in the <strong>access network</strong> (the last-mile connection to the home), not in the account or plan.</li><li>&ldquo;Why is fibre not available in my area?&rdquo; is an <strong>equipment sector</strong> question \u2014 the infrastructure has not yet been deployed there.</li><li>A service outage may be a <strong>services</strong> issue (platform or billing) or an <strong>equipment</strong> issue (physical infrastructure failure).</li></ul>Knowing which sector a problem belongs to helps agents route, explain, and set expectations correctly.', 'green'),
        ]),

        lesson('Industry challenges today', [
          heading('Major challenges facing the industry', 'Objective 03'),
          text('The telecommunications industry operates in one of the most competitive and rapidly changing environments of any sector. The challenges below are not abstract business problems \u2014 they appear in the products, pricing, and service decisions that shape every customer interaction.'),
          accordion([
            { title: 'Disruptive competition', sub: 'New rivals from outside telecom', html: 'Telecom companies no longer compete only with each other. Platform companies, messaging apps, and cloud providers offer communication and content services that overlap directly with traditional telecom offerings. This drives telecoms to expand their portfolios (streaming, cloud, IoT) while competing on price \u2014 putting pressure on profitability and shaping how products are bundled and priced.' },
            { title: 'Cost control and revenue pressure', sub: 'More for less, every year', html: 'Consumer demand for unlimited data, flexible bundles, and lower prices has driven average revenue per user down over time. Telecoms respond by offering more for less while seeking efficiency gains. This is why service plans are regularly restructured, why promotions have expiry dates, and why pricing tiers are designed the way they are.' },
            { title: 'Network investment requirements', sub: 'Multi-billion, multi-year builds', html: 'Delivering next-generation services requires continuous investment in physical infrastructure. Building out 5G, deploying edge computing, and upgrading networks are multi-billion-dollar commitments that take years to complete. This explains uneven coverage, rolling improvements, and the gap between what 5G promises and what is available in a given area right now.' },
            { title: 'Analytics, virtualisation, and automation', sub: 'Software-driven operations', html: 'Telecoms are investing heavily in data analytics to personalise services and in network virtualisation to increase flexibility without physical build-out. For agents, this shows up as AI-powered support tools, predictive call routing, and increasingly personalised customer records and recommendations.' },
            { title: '5G uncertainty', sub: 'An evolving commercial model', html: 'Despite significant investment, the full commercial model for 5G is still evolving. Whether it will primarily serve mobile consumers, replace fixed home broadband, or drive B2B services like smart cities and industrial IoT remains an open question. Customer expectations of 5G often outpace what is currently available \u2014 making accurate expectation-setting a key agent skill.' },
          ], 'orange'),
        ]),

        lesson('Digital transformation & smart cities', [
          heading('Digital transformation and the changing customer experience', 'Objective 04'),
          text('Digital transformation is not a project with a completion date. It is an ongoing shift in how telecom companies operate, compete, and serve customers. Understanding its direction helps you make sense of the changes you will see in the tools, products, and services you work with.'),
          heading('What it looks like inside a telecom', '', 'h3'),
          tabs([
            { label: 'Simplified operations', html: 'Telecoms are reducing product complexity, automating billing and account management, and developing consistent experiences across every touchpoint. <strong>Fewer product variants and more self-service options</strong> are a direct result.' },
            { label: 'Customer experience investment', html: 'Investment in AI-powered chat support, big-data analytics for personalisation, and voice-of-customer programmes reflects the industry\u2019s recognition that <strong>customer experience is now a primary competitive differentiator</strong>.' },
            { label: 'Platform adoption', html: 'Network function virtualisation (NFV) and software-defined networking (SDN) let telecoms build and modify network services in <strong>software rather than physical hardware</strong>, enabling faster product development.' },
          ]),
          heading('5G and IoT in smart cities', '', 'h3'),
          text('A smart city uses information and communication technologies to improve urban services \u2014 energy, transportation, utilities \u2014 while reducing resource consumption and cost. Telecoms are central to this because smart cities require the kind of dense, high-capacity, low-latency connectivity that only 5G can provide at scale.'),
          accordion([
            { title: 'Smart water management', html: 'IoT sensors monitor usage and detect leaks in real time, transmitting data across the telecom network to management systems.' },
            { title: 'Intelligent traffic systems', html: 'Real-time traffic data from road sensors is processed and redistributed to navigation systems and traffic-control infrastructure via connected networks.' },
            { title: 'Smart energy grids', html: 'IoT-connected meters and grid sensors transmit consumption data continuously, enabling dynamic pricing and more efficient distribution.' },
            { title: 'Public safety systems', html: 'Connected cameras, emergency-response coordination systems, and environmental sensors rely on high-capacity, low-latency networks.' },
            { title: 'Autonomous vehicle infrastructure', html: 'Vehicle-to-infrastructure communication requires near-instant data exchange, which only 5G-level latency can support reliably.' },
          ], 'magenta'),
          callout('In practice', 'Barcelona and San Francisco', 'Barcelona built a network of fibre optics and city-wide high-speed Wi-Fi to support IoT devices across the city. The result included smart water management (detecting leaks before they became visible), intelligent street lighting (adjusting to pedestrian traffic), and smart parking (directing drivers to free spaces in real time) \u2014 alongside significant savings on water, energy, and management, plus thousands of new technology jobs. San Francisco similarly adopted smart water meters and highway sensors. When customers ask why their city is not yet experiencing these innovations, the answer lies in <strong>infrastructure investment timelines</strong>: smart-city deployment is a long-term programme, not an overnight rollout.', 'blue'),
          heading('Three strategic priorities', '', 'h3'),
          text('<ol><li><strong>Customer experience</strong> \u2014 understanding customer needs through data analytics, personalising services, and making every touchpoint faster and more convenient.</li><li><strong>Service diversification</strong> \u2014 moving beyond connectivity alone to integrate content, media, cloud, and IoT into the portfolio.</li><li><strong>Harnessing digital growth</strong> \u2014 embracing new technologies as they emerge. Telecoms that move early on 5G, AI-assisted support, and smart infrastructure gain the most from first-mover advantage.</li></ol>'),
        ]),

        lesson('Key terms', [
          heading('Key terms and definitions', 'Glossary'),
          text('Tap each card to reveal the definition. These terms recur across the Communications vertical.'),
          flip([
            { accent: 'indigo', icon: 'radio', kicker: 'The industry, defined', front: 'Telecommunications', back: 'The transmission of information \u2014 voice, data, and video \u2014 over distances using electrical, optical, or wireless technology, and the industry that enables it at scale.' },
            { accent: 'blue', icon: 'zap', kicker: 'Where it began', front: 'Telegraph', back: 'The first electrical long-distance communication system, invented in the 1830s, which transmitted coded messages via electrical signals along wire. The origin point of the industry.' },
            { accent: 'green', icon: 'cable', kicker: 'Light through glass', front: 'Fibre optic', back: 'A transmission technology that uses pulses of light through glass or plastic fibres to carry data at very high speeds over long distances \u2014 far faster and higher-capacity than copper wire.' },
            { accent: 'orange', icon: 'smartphone', kicker: 'The mobile decade', front: '4G (Fourth Generation)', back: 'A cellular network standard that enabled widespread mobile internet, video streaming, and app-based services. The dominant mobile standard through most of the 2010s.' },
            { accent: 'magenta', icon: 'wifi', kicker: 'The current generation', front: '5G (Fifth Generation)', back: 'The current generation of cellular technology \u2014 faster speeds, lower latency, and support for far more simultaneous devices. The infrastructure base for IoT and smart cities.' },
            { accent: 'slate', icon: 'cpu', kicker: 'Connected devices', front: 'Internet of Things (IoT)', back: 'A network of physical devices embedded with sensors and connectivity that lets them collect and exchange data \u2014 behind smart home devices, smart-city infrastructure, and connected industrial systems.' },
            { accent: 'blue', icon: 'building', kicker: 'Connected urban life', front: 'Smart city', back: 'An urban environment that uses information and communication technologies to improve the efficiency and quality of city services \u2014 transport, energy, water, and public safety.' },
            { accent: 'indigo', icon: 'server', kicker: 'The network\u2019s spine', front: 'Core network', back: 'The central part of a telecom network that carries aggregated traffic between major urban centres and large private networks across the globe.' },
            { accent: 'green', icon: 'globe', kicker: 'Regional reach', front: 'Metropolitan Area Network (MAN)', back: 'A network that serves a regional area, connecting large businesses, campuses, and data centres to the broader network.' },
            { accent: 'orange', icon: 'wifi', kicker: 'The last mile', front: 'Access network', back: 'The portion of the network that covers the &ldquo;last mile&rdquo;, connecting individual homes and small businesses to the broader infrastructure.' },
            { accent: 'magenta', icon: 'layers', kicker: 'Software-defined', front: 'Network virtualisation (NFV / SDN)', back: 'Technologies that deliver network functions and services through software rather than dedicated physical hardware, enabling greater flexibility and faster deployment.' },
            { accent: 'slate', icon: 'sliders', kicker: 'How telecoms evolve', front: 'Digital transformation', back: 'Integrating digital technology into all areas of a business, changing how it operates and delivers value. In telecoms this includes automation, analytics, and platform adoption.' },
            { accent: 'blue', icon: 'clock', kicker: 'Speed of response', front: 'Latency', back: 'The time delay between a data signal being sent and received. Low latency (milliseconds) is critical for gaming, autonomous vehicles, and smart-city systems. 5G is designed to deliver far lower latency than 4G.' },
            { accent: 'indigo', icon: 'zap', kicker: 'New rivals', front: 'Disruptive competition', back: 'Competition from outside the traditional telecom sector \u2014 platform companies, messaging apps, cloud providers \u2014 that offer overlapping services and reshape consumer expectations.' },
          ]),
        ]),

        /* ============== SECTION: PRACTICE ============== */
        section('Practice'),

        lesson('Knowledge check: the timeline', [
          heading('Sequencing the milestones', 'Practice \u00b7 Objective 01'),
          text('These questions check that you can place the major milestones in the right order. Choose the best answer for each.'),
          mcq('Which technology came <strong>first</strong> in the evolution of telecommunications?', [
            { text: 'The telephone', feedback: 'The telephone (1876) was a major milestone, but it built on an earlier breakthrough.' },
            { text: 'The electric telegraph', feedback: 'The electric telegraph (1830s) was the first technology to separate communication from physical travel \u2014 the origin point of the industry.' },
            { text: 'Radio technology', feedback: 'Radio (early 1900s) came later, expanding reach beyond fixed wires.' },
            { text: 'The transatlantic cable', feedback: 'The first transatlantic telephone cable arrived in 1956 \u2014 well after the industry began.' },
          ], 1),
          mcq('Put these three in correct chronological order, earliest first.', [
            { text: 'Mobile networks \u2192 the internet \u2192 4G & smartphones', feedback: 'Correct. The first commercial cellular networks launched in the 1980s, the internet rose in the 1990s, and 4G with widespread smartphones followed in the 2000s\u20132010s.' },
            { text: 'The internet \u2192 mobile networks \u2192 4G & smartphones', feedback: 'Not quite \u2014 commercial mobile networks (1980s) predate the mainstream rise of the internet (1990s).' },
            { text: '4G & smartphones \u2192 mobile networks \u2192 the internet', feedback: 'This reverses the order. 4G and smartphones are the most recent of the three.' },
          ], 0),
          mcq('Which era is associated with 5G and the Internet of Things?', [
            { text: 'The 1990s', feedback: 'The 1990s belong to the rise of the internet and email.' },
            { text: 'The 2000s to 2010s', feedback: 'That era is defined by smartphones and 4G.' },
            { text: 'The 2020s onward', feedback: 'Correct. 5G and IoT define the current era \u2014 faster speeds, lower latency, and far more connected devices.' },
          ], 2),
        ]),

        lesson('Knowledge check: sectors & challenges', [
          heading('Classify the contact', 'Practice \u00b7 Objectives 02 & 03'),
          text('Read each customer situation and identify which sector or industry challenge it most directly reflects.'),
          mcq('<em>&ldquo;Fibre internet is not available on my street yet \u2014 my neighbour two streets over has it.&rdquo;</em> Which sector does this relate to?', [
            { text: 'Services sector', feedback: 'This is about whether the physical network reaches the customer\u2019s location \u2014 an infrastructure question.' },
            { text: 'Equipment sector', feedback: 'Correct. Fibre availability is an equipment-sector question: the physical infrastructure has not yet been deployed to that location. It reflects the staged rollout of network investment.' },
          ], 1),
          mcq('<em>&ldquo;Your competitor is offering unlimited data for the same price as my capped plan. Why should I stay?&rdquo;</em> Which industry challenge does this reflect?', [
            { text: 'Disruptive competition', feedback: 'Correct. A competitor offering a more attractive plan at the same price point is the direct consumer experience of disruptive competition. The agent\u2019s role is to understand and articulate the company\u2019s value proposition.' },
            { text: 'Network investment requirements', feedback: 'Network investment is about infrastructure build-out, not competing offers.' },
            { text: '5G uncertainty', feedback: 'This situation is about pricing and competition, not the commercial model for 5G.' },
          ], 0),
          mcq('<em>&ldquo;My bill went up after my promotional rate ended \u2014 I didn\u2019t realise the discount was time-limited.&rdquo;</em> Which challenge does this reflect?', [
            { text: 'Cost control and revenue pressure', feedback: 'Correct. Promotional pricing with expiry dates is a direct result of the industry balancing competitive pricing against the need to protect revenue per user.' },
            { text: 'Disruptive competition', feedback: 'Competition contributes to low prices, but the specific issue here \u2014 a time-limited promotion \u2014 is about protecting revenue.' },
            { text: 'Analytics and automation', feedback: 'This is a pricing and revenue matter, not an automation one.' },
          ], 0),
          mcq('<em>&ldquo;I got an automated message saying my issue was resolved, but I never spoke to anyone and the problem is still there.&rdquo;</em> What does this most directly reflect?', [
            { text: 'Network investment requirements', feedback: 'This is not an infrastructure issue \u2014 it concerns an automated support process.' },
            { text: 'Digital transformation (analytics & automation)', feedback: 'Correct. An automated resolution that did not actually resolve the issue reflects an automation implementation not yet fully tuned. Acknowledge the automated response, confirm the issue remains open, and handle it correctly.' },
            { text: 'Disruptive competition', feedback: 'Competition is not the driver here \u2014 the issue is an automated process that misfired.' },
          ], 1),
        ]),

        lesson('Scenario: setting expectations about 5G', [
          heading('Choose the best response', 'Practice \u00b7 Objectives 04 & 05'),
          callout('Scenario', '', 'A customer recently upgraded to a 5G-compatible device and a 5G plan after seeing ads about much faster speeds. They live in a mid-sized city and notice no difference from their previous 4G experience. They want to know if something is wrong with their device or their plan.', 'indigo'),
          mcq('Which response best reflects industry knowledge and correct expectation-setting?', [
            { text: 'Apologise and offer to downgrade the customer to their previous 4G plan at a lower price, since 5G is not working as expected.', feedback: 'Offering a downgrade without first explaining the situation misses the chance to retain the customer on the better plan and does not address the root cause. The limited 5G experience reflects infrastructure rollout, not a device or plan failure \u2014 a downgrade is not the correct first step.' },
            { text: 'Confirm the device and plan are correctly configured for 5G, then explain that coverage is still expanding and improves as more infrastructure comes online. Provide the coverage checker and set a realistic expectation for broader availability.', feedback: 'Correct. The experience is not a fault \u2014 it reflects the current stage of 5G rollout. The plan and device are correct, coverage is the variable, and it improves over time. The coverage checker gives the customer something actionable and demonstrates informed, proactive support.' },
            { text: 'Tell the customer that 5G speeds depend entirely on how many other users are on the network, and that there is nothing that can be done.', feedback: 'Partially relevant but incomplete. Congestion is one factor, but the more significant issue here is geographic 5G coverage and infrastructure density. Presenting congestion as the sole cause and offering no next step leaves the customer without useful information or a path forward.' },
          ], 1),
        ]),

        /* ============== SECTION: WRAP UP ============== */
        section('Wrap up'),

        lesson('Key takeaways', [
          heading('What to carry forward', 'Summary'),
          text('Five ideas summarise this module \u2014 one for each objective.'),
          accordion([
            { title: '01 \u00b7 Identify historical milestones', html: 'Telecommunications evolved from the telegraph (1830s) through the telephone, radio, satellite, digital, mobile, internet, fibre, and 4G into the 5G and IoT era. Each era built on the last and reshaped what customers expect from connectivity.' },
            { title: '02 \u00b7 Explain the two core sectors', html: 'The <strong>equipment sector</strong> provides physical infrastructure (core, metro, and access networks). The <strong>services sector</strong> delivers voice, data, broadband, and content \u2014 generating roughly 70% of industry revenue. Neither works without the other.' },
            { title: '03 \u00b7 Describe industry challenges', html: 'The five major challenges are disruptive competition, cost control and revenue pressure, network investment requirements, analytics and virtualisation adoption, and 5G uncertainty. They directly shape the products, pricing, and service decisions agents explain every day.' },
            { title: '04 \u00b7 Explain digital transformation & smart cities', html: 'Telecoms are simplifying operations, investing in AI and analytics, and deploying 5G and IoT as the infrastructure for smart cities. Three priorities drive this: customer experience, service diversification, and harnessing digital growth.' },
            { title: '05 \u00b7 Apply industry context to scenarios', html: 'Industry knowledge is a practical tool. Whether a customer asks about 5G coverage, a billing change, a competitor offer, or a service gap, the best answer is grounded in how the industry works \u2014 not just what the product documentation says.' },
          ], 'green'),
        ]),

        lesson('Reflect & what\u2019s next', [
          heading('Reflection', 'Debrief'),
          text('Take a few minutes with these before moving on.'),
          accordion([
            { title: 'On technology transitions', html: 'The industry has gone through several major transitions \u2014 telegraph to telephone, analog to digital, 4G to 5G. What do these transitions have in common in how they played out, and what does that tell you about setting customer expectations during any transition period?' },
            { title: 'On the two sectors', html: 'Most of your interactions sit in the services sector, but the equipment sector explains why certain things are or are not possible. Can you think of two types of customer contact where understanding the equipment sector would help you give a better answer?' },
            { title: 'On automated vs human support', html: 'Digital transformation includes AI chatbots, predictive analytics, and self-service tools. What\u2019s the right balance between automated and human support, and which types of interaction should always reach a human agent?' },
          ], 'slate'),
          divider(),
          heading('What comes next', '', 'h3'),
          text('Continue your learning journey in the Communications vertical:'),
          text('<ul><li><strong>Module 22 \u2014 Telecom Ecosystem Fundamentals.</strong> The carriers, MVNOs, OEMs, and the roles each plays in service delivery and escalation.</li><li><strong>Module 23 \u2014 Wireless and Mobile Service Foundations.</strong> Mobile networks, signal quality, roaming, plan structures, and data throttling for customer service.</li><li><strong>Module 24 \u2014 Device and OS Foundations.</strong> Phones, tablets, wearables, and the operating-system differences that affect connectivity and troubleshooting.</li></ul>'),
          callout('Nicely done', 'You\u2019ve completed the module', 'You now have the industry foundation the rest of the Communications vertical builds on. Select <strong>Finish course</strong> below to record your completion.', 'magenta'),
        ]),

      ],
    };
  };
})();


export {}; // marks this file as an ES module for Vite
