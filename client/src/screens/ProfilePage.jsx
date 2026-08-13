import { useAuthStore } from "../stores/authStore.js";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return (
    <div className="mx-auto max-w-4xl"><div><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-600">{user?.role === "student" ? "Student Account" : "School Account"}</p><h1 className="mt-2 text-3xl font-black">My Profile</h1></div><section className="snp-card mt-6 overflow-hidden"><div className="bg-gradient-to-r from-primary-700 to-sky-500 p-7 text-white"><div className="grid h-20 w-20 place-items-center rounded-xl border-2 border-white bg-white/20 text-3xl font-black shadow-[0_4px_0_0_rgba(255,255,255,0.15)]">{user?.firstName?.slice(0, 1)?.toUpperCase() || "S"}</div><h2 className="mt-4 text-2xl font-black">{name}</h2><p className="mt-1 font-semibold capitalize text-sky-100">{user?.role} account</p></div><dl className="grid gap-px bg-slate-100 sm:grid-cols-2">{[["Username", user?.username], ["Student ID", user?.studentId || "Not assigned"], ["Khmer name", user?.khmerName || "Not provided"], ["Status", user?.status]].map(([label, value]) => <div className="bg-white p-5" key={label}><dt className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-2 font-black capitalize text-ink">{value}</dd></div>)}</dl></section></div>
  );
}
