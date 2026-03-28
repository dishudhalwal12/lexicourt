import { db, auth } from "./firebase-config.js";
import { collection, addDoc, updateDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Call this from browser console: window.seedDatabase()
export async function seedDatabase() {
    console.log("Starting seed process...");
    
    // Check if logged in
    if (!auth.currentUser) {
        console.error("Must be logged in to seed data.");
        return;
    }

    const currentUid = auth.currentUser.uid;
    const nowTimestamp = new Date();

    const cases = [
        { caseNumber: "CAS-001", caseTitle: "Sharma vs State of Delhi", matterType: "Criminal", courtName: "Delhi High Court", status: "Active", clientName: "A. Sharma", oppositeParty: "State of Delhi", nextHearingDate: new Date("2026-04-15"), tags: ["Bail", "Urgent"] },
        { caseNumber: "CAS-002", caseTitle: "Mehta Property Dispute", matterType: "Civil", courtName: "Tis Hazari Court", status: "Pending", clientName: "R. Mehta", oppositeParty: "K. Mehta", nextHearingDate: new Date("2026-04-22"), tags: ["Property"] },
        { caseNumber: "CAS-003", caseTitle: "Kumar Family Settlement", matterType: "Family", courtName: "Saket District Court", status: "Won", clientName: "S. Kumar", oppositeParty: "P. Kumar", nextHearingDate: null, tags: ["Settled"] },
        { caseNumber: "CAS-004", caseTitle: "Rao Corporate Fraud", matterType: "Corporate", courtName: "Delhi HC", status: "Closed", clientName: "Rao Inc", oppositeParty: "Tax Dept", nextHearingDate: null, tags: ["Closed"] },
        { caseNumber: "CAS-005", caseTitle: "Joshi Land Acquisition", matterType: "Property", courtName: "NCLAT", status: "Active", clientName: "V. Joshi", oppositeParty: "NHAI", nextHearingDate: new Date("2026-05-10"), tags: ["Land"] },
        { caseNumber: "CAS-006", caseTitle: "Singh Labour Dispute", matterType: "Labour", courtName: "Labour Court", status: "Pending", clientName: "D. Singh", oppositeParty: "XYZ Corp", nextHearingDate: new Date("2026-04-28"), tags: ["Compensation"] },
        { caseNumber: "CAS-007", caseTitle: "Verma vs Income Tax Dept", matterType: "Tax", courtName: "ITAT Delhi", status: "Active", clientName: "H. Verma", oppositeParty: "IT Dept", nextHearingDate: new Date("2026-05-05"), tags: ["Appeal"] },
        { caseNumber: "CAS-008", caseTitle: "Gupta Bail Application", matterType: "Criminal", courtName: "Sessions Court", status: "Active", clientName: "M. Gupta", oppositeParty: "State", nextHearingDate: new Date("2026-04-18"), tags: ["Bail"] }
    ];

    try {
        let firstCaseId = null;

        for (const c of cases) {
            const docRef = await addDoc(collection(db, "caseFolders"), {
                ...c,
                ownerUid: currentUid,
                assignedUserIds: [currentUid],
                clientId: "",
                createdAt: nowTimestamp,
                updatedAt: nowTimestamp
            });
            await updateDoc(docRef, { caseId: docRef.id });

            if (!firstCaseId) {
                firstCaseId = docRef.id;
            }
            console.log("Created case:", c.caseNumber);
        }

        // Add dummy docs to the first case
        if (firstCaseId) {
            const docs = [
                { fileName: "FIR_Sharma_2025.pdf", documentType: "pdf", rawTextContent: "Dummy extracted text for FIR Sharma..." },
                { fileName: "Charge_Sheet.pdf", documentType: "pdf", rawTextContent: "Dummy extracted text for Charge Sheet..." },
                { fileName: "Bail_Application.pdf", documentType: "pdf", rawTextContent: "Dummy extracted text for Bail Application..." },
                { fileName: "Last_Court_Order.pdf", documentType: "pdf", rawTextContent: "Dummy extracted order text..." },
                { fileName: "Affidavit_Sharma.pdf", documentType: "pdf", rawTextContent: "Affidavit stated by client..." },
                { fileName: "Witness_Statement.pdf", documentType: "pdf", rawTextContent: "Witness statement details..." }
            ];

            for (const d of docs) {
                const docRef = await addDoc(collection(db, "documents"), {
                    caseId: firstCaseId,
                    ownerUid: currentUid,
                    fileName: d.fileName,
                    displayTitle: d.fileName.replace('.pdf', ''),
                    documentType: d.documentType,
                    rawTextContent: d.rawTextContent,
                    extractedText: "Auto-extracted: " + d.rawTextContent,
                    uploadStatus: "completed",
                    uploadedAt: nowTimestamp,
                    updatedAt: nowTimestamp
                });
                await updateDoc(docRef, { documentId: docRef.id });
            }
            console.log("Created dummy documents for CAS-001");
            
            // Seed a summary
             await addDoc(collection(db, "summaries"), {
                caseId: firstCaseId,
                requestedBy: currentUid,
                summaryText: "The client a Sharma has filed for bail based on lack of witness statements in the initial report.",
                summaryScope: "case",
                modelName: "gemini-pro",
                createdAt: nowTimestamp,
                updatedAt: nowTimestamp
            });

             // Seed timeline
             await addDoc(collection(db, "timelines"), {
                caseId: firstCaseId,
                generatedBy: currentUid,
                events: [
                    { date: "2025-01-10", description: "FIR Filed at Station XYZ" },
                    { date: "2025-01-20", description: "Bail application submitted to High Court" },
                    { date: "2025-02-15", description: "Bail denied by Sessions Court" }
                ],
                generatedAt: nowTimestamp,
                modelName: "gemini-pro"
            });
        }
        
        console.log("Seeding complete!");
        alert("Database seeded successfully. Refresh the page to see changes.");

    } catch (e) {
        console.error("Error seeding DB: ", e);
    }
}

// Attach to window
window.seedDatabase = seedDatabase;
