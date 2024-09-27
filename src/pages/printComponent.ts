import React from "react";
import dynamic from "next/dynamic";

const PrintJSComponent = dynamic(() => import("print-js"), { ssr: false });

interface PrintProps {
  url: string;
}

const PrintComponent: React.FC<PrintProps> = ({ url }) => {
  const handlePrint = () => {
    PrintJSComponent.printJS({
      printable: url,
      type: "pdf",
      format: "A4",
      documentTitle: "Документ для печати",
    });
  };

  return <button onClick={handlePrint}>Распечатать</button>;
};

export default PrintComponent;
