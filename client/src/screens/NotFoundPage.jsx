import { Button, Card, Result } from "antd";
import { LuArrowLeft, LuLayoutDashboard } from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f9] dark:bg-[#0f172a] p-6">
      <Card
        variant="outlined"
        className="w-full max-w-lg rounded-3xl p-6 sm:p-10 text-center shadow-xl dark:border-slate-800"
      >
        <Result
          status="404"
          title={<span className="text-3xl font-black">Page Not Found</span>}
          subTitle={
            <span className="text-slate-500 font-medium">
              The requested SNP Typing screen or lesson does not exist.
            </span>
          }
          extra={
            <Link to="/">
              <Button
                type="primary"
                size="large"
                icon={<LuLayoutDashboard size={16} />}
                className="font-bold inline-flex items-center gap-2 h-11 px-6"
              >
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          }
        />
      </Card>
    </main>
  );
}
