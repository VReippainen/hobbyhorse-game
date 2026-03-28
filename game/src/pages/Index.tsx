import KeppariGame from "@/components/KeppariGame";

const Index = () => {
  return (
    <div
      className="bg-background"
      style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      <KeppariGame />
    </div>
  );
};

export default Index;
