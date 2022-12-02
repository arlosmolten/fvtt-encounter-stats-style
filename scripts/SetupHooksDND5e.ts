import {
  OnRenderCombatTracker,
  OnCreateCombat,
  OnUpdateCombat,
  OnEncounterWorkflowComplete,
  OnUpdateHealth,
  OnTrackKill,
  OnTrackDice,
  OnTrackDiceRoll,
  OnCustomEvent,
  OnTrackRollStreak,
} from "./Handlers";
import StatManager from "./StatManager";
import DND5e from "./parsers/DND5e";
import MidiQol from "./parsers/MidiQol";
import { CombatDetailType, ChatType } from "./enums";
import Stat from "./stats/Stat";

export default class SetupHooksDND5e {
  static SOCKET_NAME = "module.encounter-stats";

  static async Setup() {
    if (game.user?.isGM) {
      SetupHooksDND5e._setupSockerListeners();
      window.Hooks.on(
        "renderCombatTracker",
        async function (
          _combatTracker: CombatTracker,
          _element: string,
          combatData: HookRenderCombatTrackerData
        ) {
          OnRenderCombatTracker(combatData);
        }
      );
      window.Hooks.on("createCombat", async function (data: Combat) {
        OnCreateCombat(data);
      });
      window.Hooks.on(
        "updateCombat",
        async function (_combat: Combat, data: HookUpdateCombatRound) {
          OnUpdateCombat(data.round);
        }
      );

      window.Hooks.on(
        "updateActor",
        async function (actor: Actor, diff: unknown) {
          await SetupHooksDND5e.updateActorToken(actor, diff);
        }
      );

      window.Hooks.on(
        "updateToken",
        async function (actor: Actor, diff: unknown) {
          await SetupHooksDND5e.updateActorToken(actor, diff);
        }
      );

      if (game.modules.get("midi-qol")?.active) {
        window.Hooks.on(
          "midi-qol.RollComplete",
          async function (workflow: MidiQolWorkflow) {
            const rollCheck = MidiQol.RollCheck(workflow);
            const midiWorkflow = MidiQol.ParseWorkflow(workflow);
            OnEncounterWorkflowComplete(midiWorkflow, ChatType.MidiQol);
            OnTrackDice(rollCheck);

            if (rollCheck && midiWorkflow) {
              OnTrackRollStreak(
                midiWorkflow.diceTotal,
                rollCheck.name,
                midiWorkflow.actor.id
              );
            }
          }
        );
      }

      Hooks.on(
        "encounter-stats.customEvent",
        async function (customEvent: HookCustomEvent) {
          OnCustomEvent(customEvent);
        }
      );
    } else {
      window.Hooks.on(
        "updateActor",
        async function (actor: Actor, diff: unknown) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "updateActor",
            data: { data: actor, diff: diff },
          });
        }
      );
      window.Hooks.on(
        "updateToken",
        async function (actor: Actor, diff: unknown) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "updateToken",
            data: { data: actor, diff: diff },
          });
        }
      );
      if (game.modules.get("midi-qol")?.active) {
        window.Hooks.on(
          "midi-qol.RollComplete",
          async function (workflow: MidiQolWorkflow) {
            game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
              event: "midi-qol.RollComplete",
              data: {
                workflow: MidiQol.ParseWorkflow(workflow),
                rollCheck: MidiQol.RollCheck(workflow),
              },
            });
          }
        );
      }

      window.Hooks.on("dnd5e.useItem", async function (item: Item) {
        if (!game.modules.get("midi-qol")?.active) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "dnd5e.useItem",
            data: {
              EncounterWorkflow: await DND5e.ParseHook(
                item,
                item.actor,
                CombatDetailType.ItemCard,
                undefined
              ),
              ChatType: ChatType.DND5e,
            },
          });
        }
      });

      window.Hooks.on(
        "dnd5e.rollAttack",
        async function (item: Item5e, roll: Roll) {
          if (!game.modules.get("midi-qol")?.active) {
            game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
              event: "dnd5e.rollAttack",
              data: {
                EncounterWorkflow: await DND5e.ParseHook(
                  item,
                  item.actor,
                  CombatDetailType.Attack,
                  roll
                ),
                ChatType: ChatType.DND5e,
              },
            });
          }
        }
      );

      window.Hooks.on(
        "dnd5e.rollDamage",
        async function (item: Item5e, roll: Roll) {
          if (!game.modules.get("midi-qol")?.active) {
            game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
              event: "dnd5e.rollDamage",
              data: {
                EncounterWorkflow: await DND5e.ParseHook(
                  item,
                  item.actor,
                  CombatDetailType.Damage,
                  roll
                ),
                ChatType: ChatType.DND5e,
              },
            });
          }
        }
      );

      window.Hooks.on(
        "dnd5e.rollAbilityTest",
        async function (actor: Actor, roll: Roll) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "dnd5e.rollAbilityTest",
            data: {
              result:
                roll?.terms[0]?.results?.find((f) => f.active === true)
                  .result ?? 0,
              alias: actor.name,
              actorId: actor.id,
              flavor: roll.options.flavor,
            },
          });
        }
      );

      window.Hooks.on(
        "dnd5e.rollAbilitySave",
        async function (actor: Actor, roll: Roll) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "dnd5e.rollAbilitySave",
            data: {
              result:
                roll?.terms[0]?.results?.find((f) => f.active === true)
                  .result ?? 0,
              alias: actor.name,
              actorId: actor.id,
              flavor: roll.options.flavor,
            },
          });
        }
      );

      window.Hooks.on(
        "dnd5e.rollSkill",
        async function (actor: Actor, roll: Roll) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "dnd5e.rollSkill",
            data: {
              result:
                roll?.terms[0]?.results?.find((f) => f.active === true)
                  .result ?? 0,
              alias: actor.name,
              actorId: actor.id,
              flavor: roll.options.flavor,
            },
          });
        }
      );

      window.Hooks.on(
        "encounter-stats.customEvent",
        async function (customEvent: HookCustomEvent) {
          game.socket?.emit(SetupHooksDND5e.SOCKET_NAME, {
            event: "encounter-stats.customEvent",
            data: {
              customEvent: customEvent,
            },
          });
        }
      );
    }
  }

  static _setupSockerListeners() {
    game.socket?.on(
      SetupHooksDND5e.SOCKET_NAME,
      async function (payload: unknown) {
        switch (payload.event) {
          case "encounter-stats.customEvent":
            OnCustomEvent(payload.data.customEvent);
            break;
          case "midi-qol.RollComplete":
            OnEncounterWorkflowComplete(
              payload.data.workflow,
              ChatType.MidiQol
            );
            OnTrackDice(payload.data.rollCheck);
            OnTrackRollStreak(
              payload.data.workflow.diceTotal,
              payload.data.rollCheck.name,
              payload.data.workflow.actor.id
            );
            break;
          case "dnd5e.rollAttack":
            OnEncounterWorkflowComplete(
              payload.data.EncounterWorkflow,
              payload.data.ChatType
            );
            OnTrackRollStreak(
              payload.data.EncounterWorkflow.diceTotal,
              payload.data.EncounterWorkflow.actorName,
              payload.data.EncounterWorkflow.actorId
            );
            break;
          case "dnd5e.useItem":
          case "dnd5e.rollDamage":
            OnEncounterWorkflowComplete(
              payload.data.EncounterWorkflow,
              payload.data.ChatType
            );
            break;
          case "dnd5e.rollAbilityTest":
          case "dnd5e.rollAbilitySave":
          case "dnd5e.rollSkill":
            OnTrackDiceRoll(
              payload.data.result,
              payload.data.alias,
              payload.data.flavor
            );
            OnTrackRollStreak(
              payload.data.result,
              payload.data.alias,
              payload.data.actorId
            );
            break;
        }
      }
    );
  }

  static async updateActorToken(actor: Actor, diff: unknown) {
    if (StatManager.IsInCombat()) {
      if (
        actor.name &&
        !actor.hasPlayerOwner &&
        diff.system?.attributes?.hp?.value === 0 &&
        game.combat?.current?.tokenId
      ) {
        OnTrackKill(actor.name, game.combat.current.tokenId);
      }
    }
    if (
      diff.system?.attributes?.hp &&
      actor.id &&
      Stat.IsValidCombatant(actor?.type)
    ) {
      OnUpdateHealth(actor);
    }
  }
}