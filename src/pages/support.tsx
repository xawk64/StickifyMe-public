import React from "react";
import Layout from "../components/Layout/Layout";

const Support: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center">
        <span>
          Напишите нам на{" "}
          <a href="mailto:support@example.com" className="text-blue-500">
            почту
          </a>
        </span>
        <span>
          или в{" "}
          <a href="https://t.me/example" className="text-blue-500">
            телеграм
          </a>
        </span>
      </div>
    </Layout>
  );
};

export default Support;
