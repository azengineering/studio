import { getUsers, type User } from "@/data/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminUsersPage() {
    const users = await getUsers();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>A list of all registered users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>MP Constituency</TableHead>
                            <TableHead>MLA Constituency</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user: User) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.state || 'N/A'}</TableCell>
                                <TableCell>{user.mpConstituency || 'N/A'}</TableCell>
                                <TableCell>{user.mlaConstituency || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
