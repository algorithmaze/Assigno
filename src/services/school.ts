/**
 * Represents the details of a school.
 */
export interface SchoolDetails {
  /**
   * The unique code for the school.
   */
  schoolCode: string;
  /**
   * The name of the school.
   */
  schoolName: string;
  /**
   * The address of the school.
   */
  address: string;
  // Add other fields like contact, principal name, etc. if needed in future
}

// In-memory store for the single school for this demo
let currentSchoolDetails: SchoolDetails = {
  schoolCode: 'samp123',
  schoolName: 'Sample Sr. Sec. School',
  address: '456 School Road, Testville',
};


/**
 * Retrieves school details based on the provided school code.
 * For this demo, it checks against the single stored school.
 *
 * @param schoolCode The unique code of the school.
 * @returns A promise that resolves to the SchoolDetails object or null if not found.
 */
export async function getSchoolDetails(schoolCode: string): Promise<SchoolDetails | null> {
  console.log(`[Service:school] Fetching details for school code: ${schoolCode}`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

  if (currentSchoolDetails.schoolCode.toLowerCase() === schoolCode.toLowerCase()) {
    return { ...currentSchoolDetails }; // Return a copy
  }
  return null;
}


/**
 * Simulates updating school details.
 * In a real application, this would call a backend API.
 *
 * @param updatedDetails The new details for the school.
 * @returns A promise that resolves to the updated SchoolDetails object or null if failed.
 */
export async function updateSchoolDetails(updatedDetails: Partial<SchoolDetails>): Promise<SchoolDetails | null> {
    console.log(`[Service:school] Simulating update for school: ${currentSchoolDetails.schoolCode}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    // For demo, only allow updating name and address for the existing school code
    if (updatedDetails.schoolName) {
        currentSchoolDetails.schoolName = updatedDetails.schoolName;
    }
    if (updatedDetails.address) {
        currentSchoolDetails.address = updatedDetails.address;
    }
    // schoolCode should not be updatable this way usually.

    console.log("[Service:school] Updated school details:", currentSchoolDetails);
    return { ...currentSchoolDetails }; // Return a copy of the updated details
}
