import { GetFolder } from "./Folder";
import SimpleCalendarIntegration from "./integrations/SimpleCalendarIntegration";

class EncounterJournal {
  static readonly JOURNAL_TITLE = "Encounter Statistics";

  static async CreateJournal() {
    const folder = GetFolder();

    await JournalEntry.create(
      {
        name: this.JOURNAL_TITLE,
        folder: folder ? folder.id : null,
      },
      { renderSheet: false, activate: false }
    );
  }

  static async CreateJournalEntryPage(encounterId: string) {
    let title = `${new Date().toISOString()}`;

    if (SimpleCalendarIntegration.IsEnabled()) {
      title = `${SimpleCalendarIntegration.GetCurrentDateToString()} (${encounterId})`;
    }

    const journalEntry = game.journal.find(
      (e) => e.name === this.JOURNAL_TITLE
    );
    journalEntry.createEmbeddedDocuments("JournalEntryPage", [
      {
        name: title,
        type: "text",
        text: {
          content: "",
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        },
        "flags.encounter-stats.encounterId": encounterId,
      },
    ]);
  }

  static async UpdateJournal(html: string, encounterId: string) {
    let journalEntryPage = game.journal
      .find((e) => e.name === this.JOURNAL_TITLE)
      ?.pages.find(
        (e) => e.getFlag("encounter-stats", "encounterId") === encounterId
      );

    await journalEntryPage?.update({
      text: {
        content: html,
      },
    });
  }

  static IsJournalSetup(): boolean {
    return (
      game.journal.find((e) => e.name === this.JOURNAL_TITLE) !== undefined
    );
  }
}

export default EncounterJournal;
/*
// Campaign Data Article
async function _getCampaignDataArticle() {
  return game.journal.find(
    (e) =>
      e.getFlag("encounter-stats", "campaigndatastats") ===
      "campaigndatastats"
  );
}

export async function GetCampaignDataArticle() {
  let article = await _getCampaignDataArticle();

  if (!article) {
    await CreateCampaignDataJournal();
  }

  return _getCampaignDataArticle();
}

export async function CreateCampaignDataJournal() {
  const folder = GetFolder();

  const article = {
    title: "Campaign Data Stats",
  };
  const content = {
    html: `{"kills": {}, "nat1": {}, "nat20": {}, "heals": {}}`,
  };

  await JournalEntry.create(
    {
      name: article.title,
      content: content.html,
      folder: folder ? folder.id : null,
      "flags.encounter-stats.campaigndatastats": "campaigndatastats",
    },
    { renderSheet: false, activate: false }
  );
}

// Campaign Article
async function _getCampaignArticle() {
  return game.journal.find(
    (e) =>
      e.getFlag("encounter-stats", "campaignstats") === "campaignstats"
  );
}

export async function GetCampaignArticle() {
  let article = await _getCampaignArticle();

  if (!article) {
    await CreateCampaignJournal();
  }

  return _getCampaignArticle();
}

export async function CreateCampaignJournal() {
  const folder = GetFolder();

  const article = {
    title: "Campaign Stats",
  };
  const content = {
    html: ``,
  };

  await JournalEntry.create(
    {
      name: article.title,
      content: content.html,
      folder: folder ? folder.id : null,
      "flags.encounter-stats.campaignstats": "campaignstats",
    },
    { renderSheet: false, activate: false }
  );
}
*/