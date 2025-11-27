import axiosInstance from "../../config/axiosConfig";

export const submitPersonalDetails = async (personalData) => {
    console.log(personalData,'personalData');
    
  try {
    const response = await axiosInstance.post(
      "deliveryRider/registration/personal-details",
      personalData
    );
    console.log("Personal details submitted:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error submitting personal details:", error.response?.data || error.message);
    throw error;
  }
};

export const uploadDocuments = async (formData) => {
try {
    const res = await axiosInstance.post('deliveryRider/registration/upload-documents', formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  console.log(res.data);
  return res.data;
} catch (error) {
    console.error("Error submitting personal details:", error.response?.data || error.message);
   console.log(error,'errorerror');
    throw error;
}
};


export const submitBankDetails = async (bankData) => {
  try {
    const response = await axiosInstance.post(
      "/deliveryRider/registration/bank-details",
      bankData
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting bank details:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getZones = async()=>{
  try {
    const response = await axiosInstance.get("/admin/zone");
    return response.data;
  } catch (error) {
    console.error("Error submitting bank details:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
}
