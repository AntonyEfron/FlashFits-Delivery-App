    import axiosInstance from "../../config/axiosConfig";


    export const verifyPhoneOtp = async (phone,otp) => {
        try {
            const response = await axiosInstance.post("/deliveryRider/auth/verify-otp", {phone, otp });
            console.log(response.data);
            return response;
        } catch (error) {
            throw error;
        }
    };