import { ExperienceForm } from "@/components/admin/ExperienceForm/ExperienceForm";

export default function NewAboutExperiencePage() {
  return <><h1 className="heading-01">New experience</h1><ExperienceForm action="/api/admin/about-experiences" /></>;
}
