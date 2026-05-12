import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import { useQuery } from "@tanstack/react-query";



// fetch user data from API
const fetchUser = async (isLoggedIn: boolean) => {
   const config = isLoggedIn ? isProtected : {}
   const response = await axiosInstance.get("/api/logged-in-user", config)
   return response.data.user 
}


const useUser = () => {
    const { setLoggedIn, isLoggedIn } = useAuthStore()

    const { data: user, isPending, isError } = useQuery({
      queryKey: ["user"],
      queryFn: () => fetchUser(isLoggedIn),
      staleTime: 1000 * 60 * 5,
      retry: false,
      // @ts-ignore
      onSuccess: () => {
        setLoggedIn(true)
      },
      onError: () => {
        setLoggedIn(false)
      }
    })

    return { user: user as any, isLoading: isPending, isError }
}
export default useUser