    import axiosInstance from "../../config/axiosConfig";


    export const verifyPhoneOtp = async (phone,otp) => {
        
        try {
        console.log('3e3e3e3');

            const response = await axiosInstance.post("/deliveryRider/auth/verify-otp", {phone, otp });
            console.log(response.data);
            
            return response.data;
        } catch (error) {
            throw error;
        }
    };