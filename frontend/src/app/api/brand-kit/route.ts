let brandKit = {
  logo: null,
  colors: { primary: "#1D4ED8", secondary: "#F59E0B", accent: "#10B981" },
  font: "Inter"
};

export async function GET() {
  return Response.json(brandKit);
}

export async function POST(req: Request) {
  const data = await req.json();
  brandKit = { ...brandKit, ...data };
  return Response.json({ success: true, brandKit });
}
