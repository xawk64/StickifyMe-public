import React from "react";
import Layout from "../components/Layout/Layout";
import ResetPasswordForm from "../components/ResetPasswordForm";

const ResetPasswordPage: React.FC = () => {
  return (
    <Layout>
      <div className="my-0 mx-auto w-80">
        <ResetPasswordForm />
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
