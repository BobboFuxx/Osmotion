// src/components/EndpointSelector.tsx
import React from "react";
import { useEndpoint } from "../hooks/useEndpoint";

const EndpointSelector: React.FC = () => {
  const { endpoint, setEndpoint, availableEndpoints } = useEndpoint();

  return (
    <div className="mb-4">
      <label className="font-semibold mr-2">Select Endpoint:</label>
      <select
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        className="p-1 rounded border"
      >
        {availableEndpoints.map((ep) => (
          <option key={ep} value={ep}>
            {ep}
          </option>
        ))}
      </select>
    </div>
  );
};

export default EndpointSelector;
