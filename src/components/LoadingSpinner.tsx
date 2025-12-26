export default function LoadingSpinner({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            {message && (
                <p className="text-lg font-medium text-gray-700 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
}
