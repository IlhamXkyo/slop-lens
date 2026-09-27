/**
 * Curated Test Samples for SlopLens Benchmarking
 */

export const SAMPLE_TEXTS = {
  corporate_slop: {
    name: 'Corporate AI Slop (GPT-5/ChatGPT archetype)',
    description: 'Filled with opening temporal crutches, "role in", em-dashes, and uniform 19-word cadence.',
    text: `In today's fast-paced world, organizations must navigate an ever-evolving technological landscape to foster enduring collaboration. Modern platforms play a crucial role in shaping operational agility across diverse enterprise teams worldwide. By leveraging cutting-edge cloud infrastructure, engineering leaders can seamlessly streamline critical product delivery pipelines with confidence. It's not just about tooling, it's about building a vibrant culture of continuous architectural excellence.

Furthermore, these transformative paradigms underscore the growing necessity for holistic data governance frameworks everywhere. Meticulous execution stands as a testament to organizational resilience during sudden unexpected shifts in market volatility. The bottom line is that embracing innovation facilitates sustainable business growth while mitigating unforeseen deployment vulnerabilities.`
  },

  claude_philosopher: {
    name: 'LLM Academic Dialect (Opus/Sonnet archetype)',
    description: 'Stacked hedges, em dashes, colon overuse, and high-entropy abstraction ("inherent tensions").',
    text: `When evaluating distributed consensus mechanisms, one must grapple with inherent tensions—namely, the trade-off between strict linearizability and rapid availability: a dilemma that permeates modern fault-tolerant databases.

This paradigm illuminates several nuanced dimensions. The architecture must remain robust: ensuring deterministic state replication across unreliable network links. The primary takeaway here is subtle. It highlights the delicate balance between low-latency writes and global consistency guarantees—a reality that practitioners navigate daily.

In essence, while formal verification may prove beneficial and could potentially reduce latency spikes under specific adversarial conditions, questions remain regarding long-term maintainability.`
  },

  authentic_human: {
    name: 'Authentic Human Prose (High burstiness & friction)',
    description: 'Irregular sentence cadence, blunt facts, domain specifics, genuine questions, zero dashes.',
    text: `We lost two nodes at 3:14 AM because the kernel ran out of memory. 

The backup daemon had leaked 18 gigabytes over four days. Nobody noticed until Prometheus triggered a paging alert to my phone. Why did the OOM killer target our primary Postgres process instead of the leaky Python worker? Because someone set the OOM score adjustment to -500 on the wrong container definition back in June.

Fixing it took twenty seconds with kubectl edit. But the postmortem meeting dragged on for three hours anyway. Engineering wanted strict memory limits; operations wanted kernel-level watchdog scripts. We settled on a bash healthcheck script running every thirty seconds.`
  },

  indonesian_slop: {
    name: 'Bahasa Indonesia AI Slop',
    description: 'Pembuka klise, kata-kata hampa makna ("menelisik lanskap", "fondasi krusial"), dan gaya bahasa generik.',
    text: `Di tengah pesatnya perkembangan era digital saat ini, transformasi teknologi memainkan peran krusial dalam memperkuat fondasi ekonomi modern. Para pelaku industri dituntut untuk mampu menelisik lanskap bisnis yang terus berubah secara dinamis.

Inovasi berkelanjutan merupakan bukti nyata komitmen perusahaan dalam menciptakan ekosistem kerja yang sinergis dan terintegrasi. Hal ini tak dapat dimungkiri menjadi tolok ukur utama keberhasilan dalam menjawab tantangan global di masa mendatang.`
  }
};
