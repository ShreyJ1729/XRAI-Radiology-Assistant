import React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const PdfGen = ({ text }) => {
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text(text, 10, 10);
        doc.save("a4.pdf");
    };
    
    return (
        <div>
            <button onClick={generatePDF}>Download PDF</button>
        </div>
    );
}

export default PdfGen;