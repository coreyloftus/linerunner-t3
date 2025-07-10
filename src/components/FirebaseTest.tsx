"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useSession } from "next-auth/react";

export default function FirebaseTest() {
  const [subcollectionName, setSubcollectionName] = useState("uploaded_data");
  const [testData, setTestData] = useState('{"name": "test", "value": 123}');
  const { data: session, status } = useSession();

  // Test query to get user documents
  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = api.firebase.getUserDocuments.useQuery(
    { subcollectionName },
    { enabled: false }, // Don't run automatically
  );

  // Test Firebase connection
  const testConnectionQuery = api.firebase.testConnection.useQuery(undefined, {
    enabled: false, // Don't run automatically
  });

  // Test mutation to add a user document
  const addDocumentMutation = api.firebase.addUserDocument.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch the documents after adding
    },
  });

  const handleAddDocument = () => {
    try {
      const data = JSON.parse(testData) as Record<string, unknown>;
      addDocumentMutation.mutate({
        subcollectionName,
        data,
      });
    } catch (error) {
      alert("Invalid JSON data");
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Firebase Connection Test</h2>

      {/* Authentication Status */}
      <div className="rounded border p-4">
        <h3 className="mb-2 text-lg font-semibold">Authentication Status:</h3>
        <p>
          <strong>Status:</strong> {status}
        </p>
        {session ? (
          <div>
            <p>
              <strong>User ID (Google Sub):</strong>{" "}
              {session.user?.id ?? "No ID"}
            </p>
            <p>
              <strong>Email:</strong> {session.user?.email ?? "No email"}
            </p>
            <p>
              <strong>Name:</strong> {session.user?.name ?? "No name"}
            </p>
            <p>
              <strong>Expected Firestore Path:</strong> users/
              {session.user?.email ?? "No email"}/uploaded_data
            </p>
          </div>
        ) : (
          <p className="text-red-600">Not authenticated</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcollection">Subcollection Name:</Label>
        <Input
          id="subcollection"
          value={subcollectionName}
          onChange={(e) => setSubcollectionName(e.target.value)}
          placeholder="Enter subcollection name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testData">Test Data (JSON):</Label>
        <Input
          id="testData"
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          placeholder='{"name": "test", "value": 123}'
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => testConnectionQuery.refetch()}
          disabled={testConnectionQuery.isLoading}
        >
          {testConnectionQuery.isLoading ? "Testing..." : "Test Connection"}
        </Button>
        <Button onClick={() => refetch()} disabled={isLoading || !session}>
          {isLoading ? "Loading..." : "Fetch Documents"}
        </Button>
        <Button
          onClick={handleAddDocument}
          disabled={addDocumentMutation.isPending || !session}
        >
          {addDocumentMutation.isPending ? "Adding..." : "Add Document"}
        </Button>
      </div>

      {error && (
        <div className="rounded border border-red-400 bg-red-100 p-4 text-red-700">
          Error: {error.message}
        </div>
      )}

      {testConnectionQuery.data && (
        <div
          className={`rounded border p-4 ${
            testConnectionQuery.data.success
              ? "border-green-400 bg-green-100 text-green-700"
              : "border-red-400 bg-red-100 text-red-700"
          }`}
        >
          <strong>Connection Test:</strong>{" "}
          {testConnectionQuery.data.success ? "SUCCESS" : "FAILED"}
          {testConnectionQuery.data.error && (
            <div className="mt-2 text-sm">
              Error: {testConnectionQuery.data.error}
            </div>
          )}
        </div>
      )}

      {documents && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Documents in {subcollectionName}:
          </h3>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
            {JSON.stringify(documents, null, 2)}
          </pre>
        </div>
      )}

      {addDocumentMutation.isSuccess && (
        <div className="rounded border border-green-400 bg-green-100 p-4 text-green-700">
          Document added successfully! ID:{" "}
          {addDocumentMutation.data?.documentId}
        </div>
      )}
    </div>
  );
}
