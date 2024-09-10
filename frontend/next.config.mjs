/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.API_URL}/:path*`, // Using API_URL instead of NEXT_PUBLIC_API_URL
        },
      ];
    },
  };
  
  export default nextConfig;
  