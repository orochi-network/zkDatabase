# zkDatabase worker

zkDatabase worker is a service that processes document-related operations such
as creating, updating, or deleting documents. It polls the database queue for
new operations and processes them sequentially to maintain consistent ordering
for each database.
