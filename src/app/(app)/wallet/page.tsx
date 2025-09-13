import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockTransactions, mockUsers } from "@/lib/mock-data";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function WalletPage() {
  const currentUser = mockUsers[0]; // Assuming user-1 is logged in
  const userTransactions = mockTransactions.filter(tx => tx.userId === currentUser.id);

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">My Wallet</h1>

      <Card className="text-center">
        <CardHeader>
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="font-headline text-5xl text-primary">
            ₹{currentUser.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button className="w-full">Add Money</Button>
          <Button variant="secondary" className="w-full">Withdraw</Button>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Transaction History</h2>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4">
              {userTransactions.length > 0 ? (
                userTransactions.map((tx, index) => (
                  <React.Fragment key={tx.id}>
                    <div className="flex items-center p-4">
                      <div className="p-2 bg-muted rounded-full mr-4">
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{format(tx.createdAt, 'PPp')}</p>
                      </div>
                      <p className={`font-bold ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </p>
                    </div>
                    {index < userTransactions.length - 1 && <Separator />}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-muted-foreground text-center p-8">No transactions yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
