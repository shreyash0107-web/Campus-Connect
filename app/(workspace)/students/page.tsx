import { getStudents, type SearchParams, param } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { StudentCard } from "@/components/cards";
import { Filters } from "@/components/filters";
import { EmptyState } from "@/components/states";
import { Pagination } from "@/components/pagination";
export const metadata = { title: "Discover Students" };
export default async function Students({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const invalid = param(params, "q").includes("*");
  const result = invalid ? { students: [], count: 0, page: 1 } : await getStudents(params);
  return <><PageHeading eyebrow="YOUR PEOPLE, YOUR CAMPUS" title="Meet your next collaborator." description="Find students who bring a different skill, a shared interest, or a fresh perspective." /><Filters key={JSON.stringify(params)} type="students" />{invalid && <p role="alert" className="mb-4 text-sm text-red-800">Use words or skill names rather than asterisks.</p>}<div className="mb-4 flex items-center justify-between"><p className="text-xs text-muted">{result.count} {result.count === 1 ? "student" : "students"} found</p><span className="text-[11px] text-muted">Newest members first</span></div>{result.students.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{result.students.map((student) => <StudentCard key={student.id} student={student} />)}</div> : <EmptyState search title="No students found" description="Try changing your search or filters. If you’re first here, invite a classmate to join." href="/students" action="Reset search" />}<Pagination {...result} params={params} path="/students" /></>;
}
