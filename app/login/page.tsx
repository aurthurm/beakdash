import { Rocket } from 'lucide-react';
import { signIn } from "@/app/auth"

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-blue-100 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-2/3 bg-orange-200 rounded-full blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="p-8 md:p-12 flex-1">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Rocket className="text-white" size={20} />
              </div>
              <span className="text-xl font-semibold">BeakDash</span>
            </div>

            <div className="mb-12">
              <h1 className="text-2xl font-bold mb-2">Welcome to BeakDash</h1>
              <p className="text-gray-600">Your Admin Dashboard</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form  action={async () => {
                  "use server";
                  await signIn("github", {
                      redirectTo: '/dashboard'
                  });
              }}>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 p-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm">Sign in with Github</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;