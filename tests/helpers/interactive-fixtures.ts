import { readInteractiveReply } from "../../src/interactive-reply";
import { emptyData, type AppData } from "../../src/types";
export const phoneSource = `root = Root([Text("Sample phone comparison"), Slider("budget", "Budget", 10000, 50000, 1000, 40000), Select("priority", "Priority", ["Battery", "Camera"], "Battery"), Table(["Phone", "Price"], [["Sample A", "30000"], ["Sample B", "35000"]]), Submit("Update recommendations", "Recommend a phone using my choices")])`;
export const expenseSource = `root = Root([Select("category", "Category", ["All", "Food", "Travel"], "All"), Chart("Sample expenses", "bar", [{label:"Lunch",value:100,category:"Food"},{label:"Bus",value:30,category:"Travel"}], "category"), Table(["Item", "Amount", "Category"], [["Lunch", "100", "Food"], ["Bus", "30", "Travel"]], "category", 2)])`;
export const formSource = `root = Root([Input("goal", "Trip goal", "", true), Input("notes", "Notes", "", false), Submit("Plan", "Plan my trip")])`;
export const phoneReply = () =>
  readInteractiveReply({
    version: 1,
    source: phoneSource,
    fallback:
      "Sample A costs 30000; Sample B costs 35000. Choose a budget and priority.",
    values: {},
  })!;
export function interactiveFixture(): AppData {
  return {
    ...emptyData(),
    connections: [
      {
        id: "p",
        name: "Synthetic",
        provider: "custom",
        protocol: "openai",
        model: "test",
        baseUrl: "https://example.invalid/v1",
      },
    ],
    defaultConnectionId: "p",
    conversations: [
      {
        id: "c",
        connectionId: "p",
        title: "Example",
        createdAt: 1,
        updatedAt: 1,
        draft: "keep my draft",
        draftAttachments: [
          {
            id: "note",
            name: "note.txt",
            mimeType: "text/plain",
            data: "x",
            size: 1,
          },
        ],
        messages: [
          {
            id: "u",
            role: "user",
            text: "Compare sample phones",
            createdAt: 1,
            status: "complete",
          },
          {
            id: "a",
            role: "assistant",
            text: phoneReply().fallback,
            interactive: phoneReply(),
            status: "complete",
            createdAt: 2,
          },
        ],
      },
    ],
  };
}
