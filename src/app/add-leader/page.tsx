
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, RotateCw } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/header';
import Footer from '@/components/footer';
import withAuth from '@/components/with-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from "@/hooks/use-toast";
import { addLeader } from '@/data/leaders';
import { indianStates } from '@/data/locations';
import { useAuth } from "@/context/auth-context";


const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  partyName: z.string().min(1, { message: "Party name is required." }),
  electionType: z.enum(['national', 'state', 'panchayat'], { required_error: "Please select an election type."}),
  constituency: z.string().min(1, { message: "Constituency is required." }),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Please select a gender."}),
  age: z.coerce.number().int({ message: "Age must be a whole number." }).positive({ message: "Age must be positive." }).min(25, { message: "Candidate must be at least 25 years old." }),
  nativeAddress: z.string().min(1, { message: "Native address is required." }),
  state: z.string().optional(),
  district: z.string().optional(),
  previousElections: z.array(z.object({
    electionType: z.string().min(1, { message: "Required" }),
    constituency: z.string().min(1, { message: "Required" }),
    state: z.string().optional(),
    status: z.enum(['winner', 'loser']),
    electionYear: z.string().min(4, { message: "Invalid year" }).max(4, { message: "Invalid year" }),
    partyName: z.string().min(1, { message: "Required" }),
  })).optional(),
  photoUrl: z.any().optional(),
  manifestoUrl: z.any().optional(),
  twitterUrl: z.string().url({ message: "Please enter a valid X/Twitter URL." }).optional().or(z.literal('')),
}).refine(data => {
    if (data.electionType === 'state' || data.electionType === 'panchayat') {
        return !!data.state;
    }
    return true;
}, {
  message: "State is required",
  path: ["state"],
});


function AddLeaderPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      partyName: "",
      constituency: "",
      nativeAddress: "",
      state: "",
      district: "",
      age: undefined,
      previousElections: [],
      photoUrl: undefined,
      manifestoUrl: undefined,
      twitterUrl: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "previousElections"
  });

  const electionType = form.watch('electionType');
  const selectedState = form.watch('state');
  
  const handleClear = () => {
    form.reset();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to add a leader.' });
        return;
    }

    const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error("Failed to read file."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });

    let photoDataUrl = '';
    if (values.photoUrl && values.photoUrl.length > 0) {
        try {
            photoDataUrl = await fileToDataUri(values.photoUrl[0]);
        } catch (error) {
            console.error("Error converting photo to data URI:", error);
            toast({ variant: 'destructive', title: 'Error uploading photo.' });
            return;
        }
    }

    let manifestoDataUrl = '';
    if (values.manifestoUrl && values.manifestoUrl.length > 0) {
        try {
            manifestoDataUrl = await fileToDataUri(values.manifestoUrl[0]);
        } catch (error) {
            console.error("Error converting manifesto to data URI:", error);
            toast({ variant: 'destructive', title: 'Error uploading manifesto.' });
            return;
        }
    }
    
    await addLeader({
        name: values.name,
        partyName: values.partyName,
        constituency: values.constituency,
        electionType: values.electionType,
        gender: values.gender,
        age: values.age,
        nativeAddress: values.nativeAddress,
        location: {
            state: values.state,
            district: values.district,
        },
        previousElections: values.previousElections || [],
        photoUrl: photoDataUrl,
        manifestoUrl: manifestoDataUrl,
        twitterUrl: values.twitterUrl,
    }, user.id);

    toast({
        title: t('addLeaderPage.successMessage'),
    });

    form.reset();
    router.push('/rate-leader');
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 max-w-4xl">
            <h1 className="font-headline text-3xl font-extrabold text-primary">{t('addLeaderPage.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('addLeaderPage.description')}</p>
        </div>
            
        <div className="max-w-4xl p-8 bg-card border rounded-lg shadow-sm">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* --- Row 1: Basic Info --- */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.nameLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.namePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="partyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.partyNameLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.partyNamePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="electionType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.electionTypeLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('addLeaderPage.selectElectionType')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="national">{t('filterDashboard.national')}</SelectItem>
                                            <SelectItem value="state">{t('filterDashboard.state')}</SelectItem>
                                            <SelectItem value="panchayat">{t('filterDashboard.panchayat')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* --- Row 2: Location Details --- */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.stateLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('addLeaderPage.selectState')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {indianStates.map(state => (
                                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="constituency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.constituencyLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.constituencyPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="nativeAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.nativeAddressLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.nativeAddressPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    {/* --- Row 3: Personal Details --- */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('addLeaderPage.genderLabel')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t('addLeaderPage.genderPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="male">{t('addLeaderPage.genderMale')}</SelectItem>
                                    <SelectItem value="female">{t('addLeaderPage.genderFemale')}</SelectItem>
                                    <SelectItem value="other">{t('addLeaderPage.genderOther')}</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.ageLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                          type="number"
                                          placeholder={t('addLeaderPage.agePlaceholder')}
                                          {...field}
                                          onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)}
                                          value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    
                    {/* --- Previous Elections --- */}
                    <div className="space-y-4">
                      <div className="border-b pb-2">
                        <h3 className="text-lg font-medium">{t('addLeaderPage.previousElectionsTitle')}</h3>
                      </div>
                      <div className="space-y-4">
                        {fields.map((item, index) => (
                          <div key={item.id} className="p-4 border rounded-md space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end">
                                <FormField
                                control={form.control}
                                name={`previousElections.${index}.electionType`}
                                render={({ field }) => (
                                    <FormItem className="col-span-12 md:col-span-2">
                                    <FormLabel className="text-xs">{t('addLeaderPage.electionTypeLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('addLeaderPage.selectElectionType')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="national">{t('filterDashboard.national')}</SelectItem>
                                        <SelectItem value="state">{t('filterDashboard.state')}</SelectItem>
                                        <SelectItem value="panchayat">{t('filterDashboard.panchayat')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`previousElections.${index}.state`}
                                render={({ field }) => (
                                    <FormItem className="col-span-12 md:col-span-2">
                                    <FormLabel className="text-xs">{t('addLeaderPage.stateLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('addLeaderPage.selectState')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {indianStates.map(state => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`previousElections.${index}.constituency`}
                                render={({ field }) => (
                                    <FormItem className="col-span-12 md:col-span-4">
                                    <FormLabel className="text-xs">{t('addLeaderPage.previousConstituencyLabel')}</FormLabel>
                                    <Input {...field} placeholder="e.g., Pune Assembly" />
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`previousElections.${index}.partyName`}
                                render={({ field }) => (
                                    <FormItem className="col-span-12 md:col-span-3">
                                    <FormLabel className="text-xs">{t('addLeaderPage.partyNameLabel')}</FormLabel>
                                    <Input {...field} placeholder="e.g., ABC Party" />
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="col-span-12 md:col-span-1"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2">
                                <FormField
                                control={form.control}
                                name={`previousElections.${index}.status`}
                                render={({ field }) => (
                                    <FormItem className="col-span-6 md:col-span-2">
                                    <FormLabel className="text-xs">{t('addLeaderPage.statusLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="winner">{t('addLeaderPage.winnerStatus')}</SelectItem>
                                            <SelectItem value="loser">{t('addLeaderPage.loserStatus')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`previousElections.${index}.electionYear`}
                                render={({ field }) => (
                                    <FormItem className="col-span-6 md:col-span-2">
                                    <FormLabel className="text-xs">{t('addLeaderPage.electionYearLabel')}</FormLabel>
                                    <Input {...field} placeholder="YYYY" />
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          onClick={() => append({ electionType: '', state: '', constituency: '', status: 'winner', electionYear: '', partyName: '' })}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {fields.length === 0 ? t('addLeaderPage.addRecordsButton') : t('addLeaderPage.addMoreButton')}
                        </Button>
                      </div>
                    </div>

                    {/* --- Row 5: Files --- */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="photoUrl"
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.photoUrlLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => onChange(e.target.files)}
                                            {...rest}
                                         />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="manifestoUrl"
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.manifestoUrlLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => onChange(e.target.files)}
                                            {...rest}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="twitterUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('addLeaderPage.twitterUrlLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('addLeaderPage.twitterUrlPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4">
                       <Button type="button" variant="outline" onClick={handleClear}>
                            <RotateCw className="mr-2 h-4 w-4" />
                            {t('addLeaderPage.clearButton')}
                        </Button>
                       <Button type="submit">
                           {t('addLeaderPage.submitButton')}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default withAuth(AddLeaderPage);
