import { Calculator } from "./calculator";

export default function Home() {
  return (
    <main className="md:flex p-4 md:items-center md:justify-center h-screen w-screen">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-bold text-3xl">🍲 Food Emission Calculator</h1>
          <p>Estimate Emissions due to Agriculture in your country</p>
        </div>
        <Calculator />
      </div>
    </main>
  );
}
