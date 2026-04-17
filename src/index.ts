import * as dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { listForms, listReports, getFormFields } from "./tools/metadata.js";
import {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from "./tools/records.js";
import { invokeFunction } from "./tools/functions.js";
import { bulkRead, backupApp } from "./tools/bulk.js";

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_forms",
    description:
      "Lists all forms defined in the Zoho Creator application. Useful for discovering available forms and their link names.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_reports",
    description:
      "Lists all reports defined in the Zoho Creator application. Use this to discover report link names before calling get_records.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_form_fields",
    description:
      "Returns metadata (field names, types, options) for all fields in a Zoho Creator form.",
    inputSchema: {
      type: "object",
      properties: {
        form_link_name: {
          type: "string",
          description: "The link name of the form (e.g. 'Employee_Details')",
        },
      },
      required: ["form_link_name"],
    },
  },
  {
    name: "get_records",
    description:
      "Reads records from a Zoho Creator report with optional filtering and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        report_link_name: {
          type: "string",
          description: "Link name of the report view",
        },
        criteria: {
          type: "string",
          description:
            'Optional Zoho criteria expression, e.g. Status == "Active"',
        },
        page: {
          type: "number",
          description: "Page number (1-based, default: 1)",
        },
        page_size: {
          type: "number",
          description: "Records per page (default: 50, max: 200)",
        },
      },
      required: ["report_link_name"],
    },
  },
  {
    name: "get_record",
    description: "Fetches a single Zoho Creator record by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        report_link_name: {
          type: "string",
          description: "Link name of the report that contains the record",
        },
        record_id: {
          type: "string",
          description: "The unique ID of the record",
        },
      },
      required: ["report_link_name", "record_id"],
    },
  },
  {
    name: "create_record",
    description:
      "Creates a new record in a Zoho Creator form. Returns the created record ID.",
    inputSchema: {
      type: "object",
      properties: {
        form_link_name: {
          type: "string",
          description: "Link name of the form to create the record in",
        },
        fields: {
          type: "object",
          description:
            "Key-value map of field link names to their values, e.g. { \"Name\": \"John\", \"Age\": 30 }",
          additionalProperties: true,
        },
      },
      required: ["form_link_name", "fields"],
    },
  },
  {
    name: "update_record",
    description: "Updates fields on an existing Zoho Creator record.",
    inputSchema: {
      type: "object",
      properties: {
        report_link_name: {
          type: "string",
          description: "Link name of the report that contains the record",
        },
        record_id: {
          type: "string",
          description: "The unique ID of the record to update",
        },
        fields: {
          type: "object",
          description: "Key-value map of field link names and their new values",
          additionalProperties: true,
        },
      },
      required: ["report_link_name", "record_id", "fields"],
    },
  },
  {
    name: "delete_record",
    description: "Deletes a Zoho Creator record by ID.",
    inputSchema: {
      type: "object",
      properties: {
        report_link_name: {
          type: "string",
          description: "Link name of the report that contains the record",
        },
        record_id: {
          type: "string",
          description: "The unique ID of the record to delete",
        },
      },
      required: ["report_link_name", "record_id"],
    },
  },
  {
    name: "invoke_function",
    description:
      "Invokes a Deluge function that has been exposed as a REST endpoint in Zoho Creator. The function must be marked as a REST endpoint in the Zoho Creator IDE.",
    inputSchema: {
      type: "object",
      properties: {
        function_link_name: {
          type: "string",
          description: "The link name of the Deluge function to invoke",
        },
        params: {
          type: "object",
          description: "Input parameters to pass to the function",
          additionalProperties: true,
        },
      },
      required: ["function_link_name"],
    },
  },
  {
    name: "bulk_read",
    description:
      "Downloads ALL records from a Zoho Creator report using the Bulk Read API. Use this before any mass data modification, insertion, or deletion as a safety backup. Returns the data as CSV text.",
    inputSchema: {
      type: "object",
      properties: {
        report_link_name: {
          type: "string",
          description: "Link name of the report to bulk-read",
        },
        criteria: {
          type: "string",
          description:
            'Optional Zoho criteria expression to filter records, e.g. Status == "Active"',
        },
      },
      required: ["report_link_name"],
    },
  },
  {
    name: "backup_app",
    description:
      "Creates a full backup of ALL forms in the Zoho Creator application. Iterates every form, downloads all records via Bulk Read API, and saves them as CSV/JSON files in the specified directory.",
    inputSchema: {
      type: "object",
      properties: {
        output_dir: {
          type: "string",
          description:
            "Local directory path where backup files will be saved (e.g. ./backups/2024-01-15)",
        },
      },
      required: ["output_dir"],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "zoho-creator", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const input = (args ?? {}) as Record<string, unknown>;

  try {
    let result: unknown;

    switch (name) {
      case "list_forms":
        result = await listForms();
        break;

      case "list_reports":
        result = await listReports();
        break;

      case "get_form_fields":
        result = await getFormFields(input.form_link_name as string);
        break;

      case "get_records":
        result = await getRecords({
          reportLinkName: input.report_link_name as string,
          criteria: input.criteria as string | undefined,
          page: input.page as number | undefined,
          pageSize: input.page_size as number | undefined,
        });
        break;

      case "get_record":
        result = await getRecord(
          input.report_link_name as string,
          input.record_id as string
        );
        break;

      case "create_record":
        result = await createRecord(
          input.form_link_name as string,
          input.fields as Record<string, unknown>
        );
        break;

      case "update_record":
        result = await updateRecord(
          input.report_link_name as string,
          input.record_id as string,
          input.fields as Record<string, unknown>
        );
        break;

      case "delete_record":
        result = await deleteRecord(
          input.report_link_name as string,
          input.record_id as string
        );
        break;

      case "invoke_function":
        result = await invokeFunction(
          input.function_link_name as string,
          (input.params as Record<string, unknown>) ?? {}
        );
        break;

      case "bulk_read":
        result = await bulkRead(
          input.report_link_name as string,
          input.criteria as string | undefined
        );
        break;

      case "backup_app":
        result = await backupApp(input.output_dir as string);
        break;

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only — stdout is reserved for MCP protocol messages
  process.stderr.write("Zoho Creator MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
