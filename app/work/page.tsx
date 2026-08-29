import { redirect } from "next/navigation";

/**
 * /work — Redirect to the homepage projects section.
 *
 * The portfolio is a single-page design: all projects live on the homepage
 * under #projects. The Case Study "Back to Work" / "Back to Portfolio" links
 * use href="/#projects" for in-page smooth-scroll. This page exists so that
 * typing /work directly into the address bar does not 404.
 */
export default function WorkPage() {
  redirect("/#projects");
}
