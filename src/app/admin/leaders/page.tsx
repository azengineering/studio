import { getLeaders, type Leader } from "@/data/leaders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminLeadersPage() {
    const leaders = await getLeaders();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leaders</CardTitle>
                <CardDescription>A list of all political leaders in the database.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Party</TableHead>
                            <TableHead>Constituency</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Rating</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaders.map((leader: Leader) => (
                            <TableRow key={leader.id}>
                                <TableCell className="font-medium">{leader.name}</TableCell>
                                <TableCell>{leader.partyName}</TableCell>
                                <TableCell>{leader.constituency}</TableCell>
                                <TableCell><Badge variant="outline" className="capitalize">{leader.electionType}</Badge></TableCell>
                                <TableCell className="text-right">{leader.rating.toFixed(2)} ({leader.reviewCount} reviews)</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
