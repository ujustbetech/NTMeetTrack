import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebaseConfig";
import { doc, collection, addDoc ,setDoc} from "firebase/firestore";

const UploadExcel = () => {
  const [excelData, setExcelData] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  
      // Convert Excel date serial numbers to readable format
      jsonData.forEach((row) => {
        if (row["Month"] && !isNaN(row["Month"])) {
          const excelDate = Number(row["Month"]); // Convert to number
          const date = new Date((excelDate - 25569) * 86400000); // Convert Excel date
          const formattedMonth = date.toLocaleDateString("en-GB", {
            year: "2-digit",
            month: "short",
          });
          row["Month"] = formattedMonth.replace(" ", "-"); // Convert "Apr 23" → "Apr-23"
        }
      });
  
      setExcelData(jsonData);
      console.log(jsonData); // Debugging
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  const uploadDataToFirestore = async () => {
    if (excelData) {
      try {
        for (let row of excelData) {
          const phoneNumber = String(row["Mobile Number"] || "").trim(); // Ensure phone number is a string
          if (!phoneNumber) {
            console.error("Skipping row due to missing phone number:", row);
            continue; // Skip rows without a phone number
          }
  
          const userRef = doc(db, "NTMembers", phoneNumber);
          
          // Ensure all fields have values, defaulting to an empty string if missing
          const activityType = String(row["Activity Type"] || "").trim(); // Use activity type as doc ID
          if (!activityType) {
            console.error("Skipping row due to missing activity type:", row);
            continue; // Skip rows without an activity type
          }
  
          const activityRef = doc(userRef, "activities", activityType); // Use activityType as doc ID
  
          const activityData = {
            month: row["Month"] || "",
            activityNo: row["Activity No"] || "",
            points: row["Points"] || 0, // Default to 0 if missing
            activityDescription: row["Activity Discription"] || "",
            phoneNumber,
          };
  
          // Add or update the document in Firestore
          await setDoc(activityRef, activityData);
        }
        alert("Data uploaded successfully to Firestore!");
      } catch (error) {
        console.error("Error uploading data:", error);
      }
    } else {
      alert("Please upload a file first.");
    }
  };
  

  return (
    <>
      <section className="c-form box">
        <h2>Upload Excel</h2>
        <button className="m-button-5" onClick={() => window.history.back()}>
          Back
        </button>
        <ul>
          <div className="upload-container">
            <input
              type="file"
              id="fileUpload"
              className="file-input"
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
            />
          </div>
          <li className="form-row">
            <div>
              <button
                className="m-button-7"
                onClick={uploadDataToFirestore}
                style={{ backgroundColor: "#f16f06", color: "white" }}
              >
                Upload
              </button>
            </div>
          </li>
        </ul>
      </section>
    </>
  );
};

export default UploadExcel;
