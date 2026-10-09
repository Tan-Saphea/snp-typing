import { useState } from "react";
import { Alert, App, Button, Form, Input } from "antd";
import { LuArrowLeft, LuLock, LuSearch } from "react-icons/lu";

import { Link, useNavigate } from "../components/NextRouter.jsx";
import { getApiErrorMessage } from "../services/api.js";
import {
  findUsernameRequest,
  resetPasswordRequest,
  verifyAccountRequest,
} from "../services/authService.js";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [step, setStep] = useState(1); // 1: Search, 2: Reset
  const [searchForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [matchedUsers, setMatchedUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [recoveryInfo, setRecoveryInfo] = useState(null);
  const [verifyingUsername, setVerifyingUsername] = useState("");

  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  async function handleSearch(values) {
    setSearchError("");
    setMatchedUsers(null);
    setIsSearching(true);
    try {
      const results = await findUsernameRequest({
        query: values.query.trim(),
      });
      setMatchedUsers(results);
      if (results.length === 1) {
        await handleSelectUser(results[0]);
      }
    } catch (err) {
      setSearchError(getApiErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectUser(user) {
    setSearchError("");
    setVerifyingUsername(user.username);

    try {
      const account = await verifyAccountRequest(user.username);
      setSelectedUser(user);
      setRecoveryInfo(account);
      setStep(2);
      resetForm.setFieldsValue({
        securityAnswer: "",
        newPassword: "",
      });
    } catch (err) {
      setSearchError(getApiErrorMessage(err));
    } finally {
      setVerifyingUsername("");
    }
  }

  async function handleResetSubmit(values) {
    setResetError("");
    if (values.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters (យ៉ាងតិច ៦ ខ្ទង់).");
      return;
    }

    setIsResetting(true);
    try {
      await resetPasswordRequest({
        username: selectedUser.username,
        newPassword: values.newPassword,
        securityAnswer: values.securityAnswer.trim(),
      });
      setResetSuccess(true);
      message.success("Password reset successfully!");
    } catch (err) {
      setResetError(getApiErrorMessage(err));
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="SNP Typing"
              className="h-20 w-auto mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0">
              Account Recovery
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 m-0">
              ស្ដារគណនី និងកំណត់លេខសម្ងាត់ថ្មី
            </p>
          </div>

          {/* SUCCESS VIEW */}
          {resetSuccess ? (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 text-3xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white m-0">
                កំណត់លេខសម្ងាត់ថ្មីជោគជ័យ!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                អ្នកអាចចូលប្រើប្រាស់ជាមួយ Username <strong>{selectedUser?.username}</strong> និងលេខសម្ងាត់ថ្មីបានហើយ។
              </p>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/login")}
                className="w-full h-11 font-semibold text-base"
              >
                Sign In Now (ចូលប្រើប្រាស់)
              </Button>
            </div>
          ) : (
            <>
              {/* STEP 1: SMART SEARCH */}
              {step === 1 && (
                <div>
                  <Form
                    form={searchForm}
                    layout="vertical"
                    onFinish={handleSearch}
                    requiredMark={false}
                  >
                    {searchError && (
                      <Alert
                        title={searchError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setSearchError("")}
                        className="mb-5 rounded-lg"
                      />
                    )}

                    <Form.Item
                      label={<span className="font-semibold text-slate-700 dark:text-slate-300">ស្វែងរកគណនីរបស់អ្នក</span>}
                      name="query"
                      rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះ ឬ Username របស់អ្នក" }]}
                      extra={
                        <span className="text-xs text-slate-400">
                          វាយឈ្មោះពេញ ឬ Username ដែលធ្លាប់ចុះឈ្មោះ
                        </span>
                      }
                    >
                      <Input
                        prefix={<LuSearch className="text-slate-400 mr-1" />}
                        placeholder="ឧ. សុវណ្ណ ឬ sovann"
                        size="large"
                        autoFocus
                      />
                    </Form.Item>

                    <Form.Item className="mt-2 mb-0">
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={isSearching}
                        className="w-full font-semibold h-11 flex items-center justify-center gap-2 text-base"
                      >
                        <LuSearch />
                        <span>Find Account (ស្វែងរក)</span>
                      </Button>
                    </Form.Item>
                  </Form>

                  {/* Multiple Search Results if any */}
                  {matchedUsers !== null && (
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                      {matchedUsers.length === 0 ? (
                        <Alert
                          title="រកមិនឃើញគណនីទេ"
                          description="សូមពិនិត្យអក្ខរាវិរុទ្ធឈ្មោះ ឬ Username របស់អ្នកឡើងវិញ។"
                          type="warning"
                          showIcon
                          className="rounded-lg"
                        />
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                            ជ្រើសរើសគណនីរបស់អ្នក ({matchedUsers.length}):
                          </p>
                          <div className="space-y-2">
                            {matchedUsers.map((user) => (
                              <div
                                key={user.username}
                                onClick={() => void handleSelectUser(user)}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-slate-750 transition cursor-pointer"
                              >
                                <div>
                                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    @{user.username}
                                  </div>
                                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                    {user.firstName} {user.lastName} {user.khmerName ? `(${user.khmerName})` : ""}
                                  </div>
                                </div>
                                <Button
                                  size="small"
                                  type="primary"
                                  loading={verifyingUsername === user.username}
                                  className="font-medium"
                                >
                                  ជ្រើសរើស
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SET NEW PASSWORD */}
              {step === 2 && (
                <div>
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                        គណនីដែលត្រូវប្តូរ
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-base">
                        @{selectedUser?.username}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedUser?.firstName} {selectedUser?.lastName}
                      </div>
                    </div>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        setStep(1);
                        setMatchedUsers(null);
                        setSelectedUser(null);
                        setRecoveryInfo(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      ប្តូរគណនី
                    </Button>
                  </div>

                  {!recoveryInfo?.hasSecurityQuestion ? (
                    <Alert
                      title="Password recovery is not configured"
                      description="This older account does not have a recovery question. Please use another account or contact the person who set up this installation."
                      type="warning"
                      showIcon
                    />
                  ) : (
                    <Form
                      form={resetForm}
                      layout="vertical"
                      onFinish={handleResetSubmit}
                      requiredMark={false}
                    >
                      {resetError && (
                        <Alert
                          title={resetError}
                          type="error"
                          showIcon
                          closable
                          onClose={() => setResetError("")}
                          className="mb-5 rounded-lg"
                        />
                      )}


                      <Form.Item
                        label={<span className="font-semibold text-slate-700 dark:text-slate-300">Recovery Key (ពាក្យគន្លឹះសង្គ្រោះគណនី)</span>}
                        name="securityAnswer"
                        rules={[
                          { required: true, message: "Please enter your recovery key (សូមបញ្ចូលពាក្យគន្លឹះ)" },
                          { min: 2, message: "Use at least 2 characters (យ៉ាងតិច ២ ខ្ទង់)" },
                        ]}
                        extra={
                          <span className="text-xs text-slate-400">
                            បញ្ចូលពាក្យគន្លឹះដែលអ្នកបានកំណត់ពេលចុះឈ្មោះគណនី។
                          </span>
                        }
                      >
                        <Input.Password
                          prefix={<LuLock className="text-slate-400 mr-1" />}
                          placeholder="Your recovery key (ពាក្យគន្លឹះរបស់អ្នក)"
                          size="large"
                          autoFocus
                        />
                      </Form.Item>

                      <Form.Item
                        label={<span className="font-semibold text-slate-700 dark:text-slate-300">New Password (លេខសម្ងាត់ថ្មី)</span>}
                        name="newPassword"
                        rules={[
                          { required: true, message: "Please enter a new password" },
                          { min: 6, message: "យ៉ាងតិច ៦ ខ្ទង់ (At least 6 characters)" },
                        ]}
                      >
                        <Input.Password
                          prefix={<LuLock className="text-slate-400 mr-1" />}
                          placeholder="យ៉ាងតិច ៦ ខ្ទង់"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item className="mt-4 mb-0">
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          loading={isResetting}
                          className="w-full font-semibold h-11 text-base"
                        >
                          Update Password (ប្តូរលេខសម្ងាត់)
                        </Button>
                      </Form.Item>
                    </Form>
                  )}
                </div>
              )}
            </>
          )}

          {/* Bottom Back to Sign In */}
          <div className="text-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#52c41a]"
            >
              <LuArrowLeft size={16} />
              <span>Back to Sign In (ត្រឡប់ទៅចូលប្រើ)</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
