"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { indianStates, districtsByState } from '@/data/locations';
import type { Leader } from '@/data/leaders';

type ElectionType = 'national' | 'state' | 'panchayat';

interface FilterDashboardProps {
  allLeaders: Leader[];
  onFilterChange: (filteredLeaders: Leader[]) => void;
}

export default function FilterDashboard({ allLeaders, onFilterChange }: FilterDashboardProps) {
  const [electionType, setElectionType] = useState<ElectionType>('national');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const applyFilters = useCallback(() => {
    let filtered = allLeaders.filter(leader => leader.electionType === electionType);

    if (electionType === 'state') {
      if (selectedState) {
        filtered = filtered.filter(l => l.location.state === selectedState);
      }
    } else if (electionType === 'panchayat') {
      if (selectedState) {
        filtered = filtered.filter(l => l.location.state === selectedState);
        if (selectedDistrict) {
          filtered = filtered.filter(l => l.location.district === selectedDistrict);
        }
      }
    }

    onFilterChange(filtered);
  }, [electionType, selectedState, selectedDistrict, allLeaders, onFilterChange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleElectionTypeChange = (value: string) => {
    const type = value as ElectionType;
    setElectionType(type);
    setSelectedState('');
    setSelectedDistrict('');
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict('');
  };
  
  return (
    <Card id="filter-section" className="shadow-lg border-2 border-primary/10 scroll-mt-20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Find Your Representative</CardTitle>
        <CardDescription>Use the filters below to find leaders at different levels of government.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={electionType} onValueChange={handleElectionTypeChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="national">National</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="panchayat">Panchayat</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 min-h-[6rem] transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end animate-in fade-in-50 duration-300">
              { (electionType === 'state' || electionType === 'panchayat') && (
                <div className="grid gap-2">
                  <Label htmlFor="state-select">State</Label>
                  <Select value={selectedState} onValueChange={handleStateChange}>
                    <SelectTrigger id="state-select" className="bg-background">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              { electionType === 'panchayat' && (
                <div className="grid gap-2">
                  <Label htmlFor="district-select">District / Panchayat</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedState}>
                    <SelectTrigger id="district-select" className="bg-background">
                      <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedState && districtsByState[selectedState] ? (
                        districtsByState[selectedState].map(district => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {selectedState ? 'No districts available' : 'Select a state first'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
