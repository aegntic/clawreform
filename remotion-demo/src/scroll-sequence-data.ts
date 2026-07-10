export type NarrativeStep = {
  index: string;
  title: string;
  desc: string;
};

export const fabricSteps: NarrativeStep[] = [
  {
    index: "01",
    title: "A trigger wakes the system",
    desc: "A timer, webhook, or message turns a rule into a real task the runtime can act on.",
  },
  {
    index: "02",
    title: "The runtime picks the right agent",
    desc: "Health, budget, and capability checks decide which specialist should handle the task.",
  },
  {
    index: "03",
    title: "That agent does one bounded job",
    desc: "The agent wakes, uses a clear contract, and writes an explicit artifact instead of vague chat residue.",
  },
  {
    index: "04",
    title: "The result gets checked",
    desc: "Tests, scores, or policy gates verify the output before the system treats it as real.",
  },
  {
    index: "05",
    title: "The system records what happened",
    desc: "The trace, decision, and artifact are saved so the run can be audited, repaired, or replayed later.",
  },
];

export const memorySteps: NarrativeStep[] = [
  {
    index: "01",
    title: "Core",
    desc: "Small durable truths that should survive across projects and over time.",
  },
  {
    index: "02",
    title: "Overview",
    desc: "The current high-level map of what matters now, synthesized from real records instead of chat scraps.",
  },
  {
    index: "03",
    title: "Projects",
    desc: "Per-project dossiers where repeated, relevant, validated knowledge becomes canonical.",
  },
  {
    index: "04",
    title: "Working detail",
    desc: "Hot short-term context that helps with current work but is not allowed to silently become doctrine.",
  },
];
