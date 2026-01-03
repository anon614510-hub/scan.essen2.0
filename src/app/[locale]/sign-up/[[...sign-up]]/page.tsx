import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f4f7f0]">
            <SignUp />
        </div>
    );
}
