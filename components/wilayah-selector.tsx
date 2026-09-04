// components/wilayah-selector.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, MapPin, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface WilayahItem {
  id: string;
  name: string;
}

export interface WilayahSelection {
  province: WilayahItem | null;
  regency: WilayahItem | null;
  district: WilayahItem | null;
  village: WilayahItem | null;
}

// Interface untuk data desa dengan koordinat
export interface VillageData {
  name: string;
  lat: number;
  lng: number;
}

interface LocationData {
  locations: Array<{
    name: string;
    lat: number;
    lng: number;
    province: string;
    regency: string;
    district: string;
    villages: VillageData[];
  }>;
}

interface WilayahSelectorProps {
  value?: Partial<WilayahSelection> | null;
  onChange: (
    selection: WilayahSelection,
    fullAddress: string,
    coords?: { lat: number; lng: number },
  ) => void;
}

export default function WilayahSelector({
  value,
  onChange,
}: WilayahSelectorProps) {
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<WilayahItem | null>(
    null,
  );
  const [selectedRegency, setSelectedRegency] = useState<WilayahItem | null>(
    null,
  );
  const [selectedDistrict, setSelectedDistrict] = useState<WilayahItem | null>(
    null,
  );
  const [selectedVillage, setSelectedVillage] = useState<WilayahItem | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localData, setLocalData] = useState<LocationData | null>(null);
  const [isInternalChange, setIsInternalChange] = useState(false);

  // Ref untuk mencegah infinite loop
  const lastSelectedVillageRef = useRef<string | null>(null);
  // Ref untuk menyimpan data desa lengkap dengan koordinat
  const villageDataRef = useRef<Map<string, VillageData>>(new Map());

  // Load data lokal dari file JSON
  useEffect(() => {
    setLoading(true);
    fetch("/data/locations.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setLocalData(data);
        
        // Extract unique provinces
        const provinceSet = new Set<string>();
        data.locations.forEach((loc: any) => provinceSet.add(loc.province));
        const provs = Array.from(provinceSet).map((name, index) => ({
          id: `prov-${index + 1}`,
          name,
        }));
        setProvinces(provs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading local data:", err);
        setError(
          "Gagal memuat data wilayah. Pastikan file locations.json ada di /public/data/",
        );
        setLoading(false);
      });
  }, []);

  // Set value dari prop setelah data siap
  useEffect(() => {
    if (loading || !value) return;

    if (value.province && !selectedProvince) {
      setSelectedProvince(value.province);
    }
    if (value.regency && !selectedRegency) {
      setSelectedRegency(value.regency);
    }
    if (value.district && !selectedDistrict) {
      setSelectedDistrict(value.district);
    }
    if (value.village && !selectedVillage) {
      setSelectedVillage(value.village);
      lastSelectedVillageRef.current = value.village.id;
    }
  }, [loading, value, selectedProvince, selectedRegency, selectedDistrict, selectedVillage]);

  // Load regencies when province changes
  useEffect(() => {
    if (!selectedProvince || !localData || loading) return;

    const regencySet = new Set<string>();
    localData.locations
      .filter((loc) => loc.province === selectedProvince.name)
      .forEach((loc) => regencySet.add(loc.regency));
    
    const regs = Array.from(regencySet).map((name, index) => ({
      id: `regency-${index + 1}`,
      name,
    }));
    setRegencies(regs);
    
    // Auto-select if only one regency
    if (regs.length === 1 && !selectedRegency) {
      setSelectedRegency(regs[0]);
    }
  }, [selectedProvince, localData, loading]);

  // Load districts when regency changes
  useEffect(() => {
    if (!selectedRegency || !selectedProvince || !localData || loading) return;

    const districtSet = new Set<string>();
    localData.locations
      .filter(
        (loc) =>
          loc.province === selectedProvince.name &&
          loc.regency === selectedRegency.name,
      )
      .forEach((loc) => districtSet.add(loc.district));
    
    const dists = Array.from(districtSet).map((name, index) => ({
      id: `district-${index + 1}`,
      name,
    }));
    setDistricts(dists);
    
    // Auto-select if only one district
    if (dists.length === 1 && !selectedDistrict) {
      setSelectedDistrict(dists[0]);
    }
  }, [selectedRegency, selectedProvince, localData, loading]);

  // Load villages when district changes
  useEffect(() => {
    if (!selectedDistrict || !selectedRegency || !selectedProvince || !localData || loading)
      return;

    // Clear village data ref
    villageDataRef.current.clear();

    const villageList: WilayahItem[] = [];
    localData.locations
      .filter(
        (loc) =>
          loc.province === selectedProvince.name &&
          loc.regency === selectedRegency.name &&
          loc.district === selectedDistrict.name,
      )
      .forEach((loc) => {
        loc.villages?.forEach((v) => {
          villageList.push({
            id: `village-${villageList.length + 1}`,
            name: v.name,
          });
          // Simpan data koordinat desa
          villageDataRef.current.set(v.name, v);
        });
      });
    
    setVillages(villageList);
    
    // Auto-select if only one village
    if (villageList.length === 1 && !selectedVillage) {
      setSelectedVillage(villageList[0]);
    }
  }, [selectedDistrict, selectedRegency, selectedProvince, localData, loading]);

  // Cari koordinat desa dari data lokal
  const getVillageCoords = (villageName: string): { lat: number; lng: number } | undefined => {
    const villageData = villageDataRef.current.get(villageName);
    if (villageData) {
      return { lat: villageData.lat, lng: villageData.lng };
    }
    return undefined;
  };

  // Cari koordinat kecamatan dari data lokal (fallback)
  const getDistrictCoords = (): { lat: number; lng: number } | undefined => {
    if (!localData || !selectedProvince || !selectedRegency || !selectedDistrict) {
      return undefined;
    }
    const match = localData.locations.find(
      (loc) =>
        loc.province === selectedProvince.name &&
        loc.regency === selectedRegency.name &&
        loc.district === selectedDistrict.name,
    );
    return match ? { lat: match.lat, lng: match.lng } : undefined;
  };

  // Trigger onChange when village is selected
  useEffect(() => {
    if (
      selectedVillage &&
      selectedDistrict &&
      selectedRegency &&
      selectedProvince &&
      !loading &&
      !isInternalChange
    ) {
      const isNewSelection =
        lastSelectedVillageRef.current !== selectedVillage.id;

      if (isNewSelection) {
        lastSelectedVillageRef.current = selectedVillage.id;
        const fullAddress = `${selectedVillage.name}, ${selectedDistrict.name}, ${selectedRegency.name}, ${selectedProvince.name}`;
        
        // Prioritaskan koordinat desa, fallback ke kecamatan
        const villageCoords = getVillageCoords(selectedVillage.name);
        const coords = villageCoords || getDistrictCoords();
        
        onChange(
          {
            province: selectedProvince,
            regency: selectedRegency,
            district: selectedDistrict,
            village: selectedVillage,
          },
          fullAddress,
          coords,
        );
      }
    }
  }, [selectedVillage, selectedDistrict, selectedRegency, selectedProvince, onChange, loading, isInternalChange]);

  // Fixed: Properly typed onChange handlers with string | null
  const handleProvinceChange = (id: string | null) => {
    const province = provinces.find((p) => p.id === id) || null;
    setIsInternalChange(true);
    setSelectedProvince(province);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    villageDataRef.current.clear();
    setError(null);
    setTimeout(() => setIsInternalChange(false), 100);
  };

  const handleRegencyChange = (id: string | null) => {
    const regency = regencies.find((r) => r.id === id) || null;
    setIsInternalChange(true);
    setSelectedRegency(regency);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setDistricts([]);
    setVillages([]);
    villageDataRef.current.clear();
    setError(null);
    setTimeout(() => setIsInternalChange(false), 100);
  };

  const handleDistrictChange = (id: string | null) => {
    const district = districts.find((d) => d.id === id) || null;
    setIsInternalChange(true);
    setSelectedDistrict(district);
    setSelectedVillage(null);
    setVillages([]);
    villageDataRef.current.clear();
    setError(null);
    setTimeout(() => setIsInternalChange(false), 100);
  };

  const handleVillageChange = (id: string | null) => {
    const village = villages.find((v) => v.id === id) || null;
    setIsInternalChange(true);
    setSelectedVillage(village);
    setTimeout(() => setIsInternalChange(false), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat data wilayah...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="font-medium">⚠️ {error}</p>
        <p className="text-xs mt-1">
          Pastikan file <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">public/data/locations.json</code> ada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Provinsi */}
        <div className="space-y-1.5">
          <Label className="text-xs">Provinsi</Label>
          <Select
            value={selectedProvince?.id ?? ""}
            onValueChange={handleProvinceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih provinsi" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {provinces.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kabupaten/Kota */}
        <div className="space-y-1.5">
          <Label className="text-xs">Kabupaten/Kota</Label>
          <Select
            value={selectedRegency?.id ?? ""}
            onValueChange={handleRegencyChange}
            disabled={!selectedProvince}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  selectedProvince ? "Pilih kabupaten/kota" : "Pilih provinsi dahulu"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {regencies.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kecamatan */}
        <div className="space-y-1.5">
          <Label className="text-xs">Kecamatan</Label>
          <Select
            value={selectedDistrict?.id ?? ""}
            onValueChange={handleDistrictChange}
            disabled={!selectedRegency}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  selectedRegency ? "Pilih kecamatan" : "Pilih kabupaten/kota dahulu"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desa/Kelurahan */}
        <div className="space-y-1.5">
          <Label className="text-xs">Desa/Kelurahan</Label>
          <Select
            value={selectedVillage?.id ?? ""}
            onValueChange={handleVillageChange}
            disabled={!selectedDistrict}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  selectedDistrict ? "Pilih desa/kelurahan" : "Pilih kecamatan dahulu"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {villages.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedVillage &&
        selectedDistrict &&
        selectedRegency &&
        selectedProvince && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {selectedVillage.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedDistrict.name}, {selectedRegency.name},{" "}
                {selectedProvince.name}
              </p>
            </div>
            <Badge
              variant="default"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 flex-shrink-0"
            >
              <Check className="h-3 w-3" />
              Terpilih
            </Badge>
          </div>
        )}
    </div>
  );
}