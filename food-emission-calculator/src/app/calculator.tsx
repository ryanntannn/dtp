"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import calcJson from "./targets_json_map.json";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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

function predictEmissions(
  regression: {
    beta: number[][];
    means: number[];
    stds: number[];
  },
  totalPopulation: number,
  urbanPercentage: number
) {
  return (
    regression.beta[0][0] +
    (regression.beta[1][0] * (totalPopulation - regression.means[0])) /
      regression.stds[0] +
    (regression.beta[2][0] * (urbanPercentage / 100 - regression.means[1])) /
      regression.stds[1]
  );
}

export function Calculator() {
  const [countryName, setCountryName] = useState<keyof typeof calcJson | null>(
    null
  );

  const [baselineUrbanPercentage, setBaselineUrbanPercentage] =
    useState<number>(50);
  const [baselineTotalPopulation, setBaselineTotalPopulation] = useState<
    string | null
  >(null);
  const [urbanPercentage, setUrbanPercentage] = useState<number>(50);
  const [totalPopulation, setTotalPopulation] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedCountry) return;
    setTotalPopulation(
      (
        selectedCountry?.["IPPU"].means[0] + selectedCountry?.["IPPU"].means[1]
      ).toFixed()
    );
    setUrbanPercentage(selectedCountry?.["IPPU"].means[1] * 100);

    setBaselineTotalPopulation(
      (
        selectedCountry?.["IPPU"].means[0] + selectedCountry?.["IPPU"].means[1]
      ).toFixed()
    );
    setBaselineUrbanPercentage(selectedCountry?.["IPPU"].means[1] * 100);
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
        <div className="flex flex-col gap-2 border rounded-lg p-3">
          <h2>Baseline</h2>
          <div>
            <div className="text-sm">Total Population</div>
            <div className="flex flex-row gap-2">
              <Input
                type="number"
                placeholder="Total Population"
                disabled={!countryName}
                value={baselineTotalPopulation ?? ""}
                onChange={(e) => {
                  setBaselineTotalPopulation(e.target.value);
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
                  {numberToHumanReadable(baselineUrbanPercentage)}%
                </span>
              </div>
              <div className="text-sm text-right">
                Rural Population
                <br />
                <span className="text-xs">
                  {numberToHumanReadable(100 - baselineUrbanPercentage)}%
                </span>
              </div>
            </div>
            <Slider
              defaultValue={[33]}
              max={100}
              step={1}
              value={[baselineUrbanPercentage]}
              onValueChange={(v) => {
                setBaselineUrbanPercentage(v[0]);
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 border rounded-lg p-3">
          <div className="flex flex-row items-center justify-between">
            <h2>New</h2>
            <Button
              onClick={() => {
                setTotalPopulation(baselineTotalPopulation);
                setUrbanPercentage(baselineUrbanPercentage);
              }}>
              Reset
            </Button>
          </div>
          <div>
            <div className="text-sm">
              Total Population (+
              {numberToHumanReadable(
                parseFloat(totalPopulation ?? "0") -
                  parseFloat(baselineTotalPopulation ?? "0")
              )}{" "}
              from baseline){" "}
            </div>
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
      </div>

      {selectedCountry &&
        urbanPercentage &&
        totalPopulation &&
        baselineTotalPopulation &&
        baselineUrbanPercentage && (
          <div className="max-h-[700px] w-full overflow-y-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead>Baseline Emissions (kgCO₂eq)</TableHead>
                  <TableHead>New Emissions (kgCO₂eq)</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Mean Absolute Percentage Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(selectedCountry).map(([key, value]) => {
                  const predictedBaselineEmissions = predictEmissions(
                    value,
                    parseInt(baselineTotalPopulation),
                    baselineUrbanPercentage
                  );
                  const predictedEmissions = predictEmissions(
                    value,
                    parseInt(totalPopulation),
                    urbanPercentage
                  );
                  const delta =
                    ((predictedEmissions - predictedBaselineEmissions) /
                      predictedBaselineEmissions) *
                    100;
                  return (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>
                        {numberToHumanReadable(predictedBaselineEmissions)}
                      </TableCell>
                      <TableCell>
                        {numberToHumanReadable(predictedEmissions)}
                      </TableCell>
                      <TableCell
                        className={
                          delta < 0
                            ? "text-green-600"
                            : delta === 0
                            ? "text-gray-500"
                            : "text-red-600"
                        }>
                        {delta > 0 && "+"}
                        {numberToHumanReadable(delta)}%
                      </TableCell>
                      <TableCell
                        className={
                          value?.mape === undefined
                            ? "text-gray-500"
                            : value?.mape < 0.1
                            ? "text-green-600"
                            : value?.mape < 0.2
                            ? "text-yellow-600"
                            : "text-red-600"
                        }>
                        {((value?.mape ?? 0) * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}
