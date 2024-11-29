"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import calcJson from "./area_json_map.json";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";

function numberToHumanReadable(num: number) {
  const absNum = Math.abs(num);
  if (absNum < 1e3) {
    return num.toFixed(2);
  } else if (absNum < 1e6) {
    return (num / 1e3).toFixed(2) + "K";
  } else if (absNum < 1e9) {
    return (num / 1e6).toFixed(2) + "M";
  } else {
    return (num / 1e9).toFixed(2) + "B";
  }
}

export function Calculator() {
  const [countryName, setCountryName] = useState<keyof typeof calcJson | null>(
    null
  );

  const [urbanPercentage, setUrbanPercentage] = useState<number>(50);
  const [totalPopulation, setTotalPopulation] = useState<string | null>(null);
  const [year, setYear] = useState<string>("2025");

  const selectedCountry = useMemo(() => {
    if (!countryName) return null;
    return calcJson[countryName];
  }, [countryName]);

  const urbanPopulation = useMemo(() => {
    if (!totalPopulation) return 0;

    return (parseInt(totalPopulation) * urbanPercentage) / 100;
  }, [totalPopulation, urbanPercentage]);

  const ruralPopulation = useMemo(() => {
    if (!totalPopulation) return 0;

    return parseInt(totalPopulation) - urbanPopulation;
  }, [totalPopulation, urbanPopulation]);

  const predictedEmissions = useMemo(() => {
    if (!selectedCountry || !totalPopulation || !year) return;

    return (
      selectedCountry.betas[0][0] +
      selectedCountry.betas[1][0] *
        ((parseInt(totalPopulation) - selectedCountry.means[0]) /
          selectedCountry.stds[0]) +
      (selectedCountry.betas[2][0] *
        (urbanPercentage / 100 - selectedCountry.means[1])) /
        selectedCountry.stds[1] +
      selectedCountry.betas[3][0] *
        ((parseInt(year) - selectedCountry.means[2]) / selectedCountry.stds[2])
    );
  }, [selectedCountry, totalPopulation, urbanPercentage, year]);

  useEffect(() => {
    if (!selectedCountry) return;
    setTotalPopulation(
      (selectedCountry?.means[0] + selectedCountry?.means[1]).toFixed()
    );
    setUrbanPercentage(selectedCountry?.means[1] * 100);
  }, [selectedCountry]);

  return (
    <div className="flex flex-row gap-4 p-4 border rounded-xl">
      <div className="flex flex-col gap-4 w-full min-w-[300px]">
        <Select
          value={countryName ?? undefined}
          onValueChange={(v) => setCountryName(v as keyof typeof calcJson)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a country" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(calcJson).map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <div className="text-sm">Year</div>
          <Input
            type="number"
            placeholder="Year - 2024"
            disabled={!countryName}
            value={year ?? ""}
            onChange={(e) => {
              setYear(e.target.value);
            }}
          />
        </div>

        <div>
          <div className="text-sm">Total Population</div>
          <div className="flex flex-row gap-2">
            <Input
              type="number"
              placeholder="Total Population"
              disabled={!countryName}
              value={totalPopulation ?? ""}
              onChange={(e) => {
                setTotalPopulation(e.target.value);
              }}
              step={250000}
              min={0}
            />
          </div>
        </div>
        <div>
          <div className="flex flex-row justify-between">
            <div className="text-sm">
              Urban Population
              <br />
              <span className="text-xs">
                {numberToHumanReadable(urbanPopulation)}
              </span>
            </div>
            <div className="text-sm text-right">
              Rural Population
              <br />
              <span className="text-xs">
                {numberToHumanReadable(ruralPopulation)}
              </span>
            </div>
          </div>
          <Slider
            defaultValue={[33]}
            max={100}
            step={1}
            value={[urbanPercentage]}
            onValueChange={(v) => {
              setUrbanPercentage(v[0]);
            }}
          />
        </div>
      </div>
      {predictedEmissions && (
        <div className="flex flex-col gap-4 w-full">
          <p>
            Predicted Emissions (kgCO₂eq): <br />
            <span className="text-3xl">
              {numberToHumanReadable(predictedEmissions)}
            </span>
          </p>
          <p>
            Mean Absolute Percentage Error: <br />
            <span className="text-3xl">
              {((selectedCountry?.mape ?? 0) * 100).toFixed(2)}%
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
