import { motion } from "motion/react";
import { GraduationCap, ExternalLink, BadgeCheck, Cpu } from "lucide-react";
import { useT } from "@/lib/i18n";

type Course = {
  key: string;
  title: string;
  provider: string;
  minutes: number;
  level: "Beginner" | "Intermediate";
  url: string;
};

const COURSES: Course[] = [
  {
    key: "ai-fundamentals",
    title: "Artificial Intelligence Fundamentals",
    provider: "IBM SkillsBuild",
    minutes: 360,
    level: "Beginner",
    url: "https://skillsbuild.org/students/course-catalog/artificial-intelligence",
  },
  {
    key: "data-analytics",
    title: "Data Analytics Basics for Agriculture",
    provider: "IBM SkillsBuild",
    minutes: 240,
    level: "Beginner",
    url: "https://skillsbuild.org/students/course-catalog/data-science",
  },
  {
    key: "sustainability",
    title: "Sustainability and Climate Intelligence",
    provider: "IBM SkillsBuild",
    minutes: 180,
    level: "Beginner",
    url: "https://skillsbuild.org/students/course-catalog/sustainability",
  },
  {
    key: "watsonx",
    title: "Generative AI with watsonx",
    provider: "IBM SkillsBuild",
    minutes: 300,
    level: "Intermediate",
    url: "https://skillsbuild.org/adult-learners/explore-learning/artificial-intelligence",
  },
  {
    key: "cyber",
    title: "Cybersecurity Essentials for Digital Farmers",
    provider: "IBM SkillsBuild",
    minutes: 210,
    level: "Beginner",
    url: "https://skillsbuild.org/students/course-catalog/cybersecurity",
  },
  {
    key: "entrepreneur",
    title: "Agri-Entrepreneurship & Market Readiness",
    provider: "IBM SkillsBuild",
    minutes: 150,
    level: "Beginner",
    url: "https://skillsbuild.org/students/course-catalog/professional-skills",
  },
];

export function SkillsBuildPanel() {
  const tr = useT();

  return (
    <section className="rounded-2xl border border-border bg-surface-2/40 p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold">
          <GraduationCap className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{tr("skillsTitle")}</h2>
          <p className="text-xs text-muted-foreground">{tr("skillsSub")}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-surface-1/60 px-3 py-1 text-[11px] text-muted-foreground">
          <Cpu className="size-3.5 text-gold" />
          {tr("poweredByWatsonx")}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {COURSES.map((c, i) => (
          <motion.a
            key={c.key}
            href={c.url}
            target="_blank"
            rel="noreferrer noopener"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex flex-col rounded-xl border border-border bg-surface-1/60 p-4 transition hover:border-gold/50"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium leading-snug">{c.title}</h3>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition group-hover:text-gold" />
            </div>
            <p className="text-xs text-muted-foreground">{c.provider}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-0.5">{tr(c.level)}</span>
              <span className="rounded-full border border-border px-2 py-0.5">
                {Math.round(c.minutes / 60)} {tr("hours")}
              </span>
              <span className="ml-auto flex items-center gap-1 text-gold">
                <BadgeCheck className="size-3.5" />
                {tr("digitalCredential")}
              </span>
            </div>
          </motion.a>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{tr("skillsFooter")}</p>
    </section>
  );
}
