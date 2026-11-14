# Moonbeam Meadow playtest guide

Use this when changing the 3D expedition. A beautiful screenshot does not establish that the game is playable: use the same keyboard, pointer and touch controls that visitors use.

## References

- [Unity Cinemachine: Third Person Follow](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineThirdPersonFollow.html): control follow distance, framing, damping and camera obstruction resolution.
- [Godot: third-person camera with a spring arm](https://docs.godotengine.org/en/stable/tutorials/3d/spring_arm.html): prevent the camera from clipping through geometry and hiding the scene.
- [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines), particularly [109: objective clarity](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/109) and [117: visual distractions and motion settings](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117): give clear objectives, show progress, and provide view and motion controls.

These are design references, not a claim of full accessibility conformance. Numeric framing and scoring below are decisions for this game, not universal industry standards.

## Camera and character

- At the default 17 m viewing distance, the pony occupies under 20% of viewport height in an open view. Check wide desktop, square and narrow portrait layouts. The route and nearby pickups should be visible ahead of the character.
- The pony model uses a 0.82 scale: its horn reaches approximately the player's 2.9 m collision height. Camera distance can be adjusted from 14–26 m in the pause menu and persists with the save.
- Walk, fly, strafe, descend, and drag the view. Look for camera jumps, geometry clipping, obstacles hiding the player, or HUD overlaps. Camera obstruction handling may temporarily retract the view; it should recover smoothly.
- Start/resume at a distant checkpoint. The first playable frame should already use the follow camera, rather than fly across the world from the title screen.
- Review the silhouette and facial expression from several angles, not just from behind. Wings fold while standing and flap in flight. Hair must remain continuous rather than a chain of faceted blobs.

## Pickups and rewards

1. Start a new journey and walk through the blue crystal: it disappears, unlocks flight, shows +100, and updates the persistent points total.
2. On a lantern island, walk or fly through each gold diamond marked +50. Check contact at head height, at normal speed, and while dashing. Each disappears once and produces a points toast and a sparkle burst. The compass reports whether to climb or descend.
3. A framed lantern is architecture, not a collectible diamond. After collecting its three diamonds, land beside it and use E **or click** the restore button. It lights, awards +250, and unlocks a named reward.
4. Open Rewards and claim/equip the unlocked item. Claiming gives +100 exactly once. Wings or crown and flight trail visibly change; switching or removing equipped items does not farm points.
5. Reload and continue. Collected diamonds, restored lanterns, points, claimed/equipped rewards and camera preference survive. Existing saves receive points for their existing progress.
6. Complete the ring race: its first completion awards +300. Replaying improves the best time without repeatedly granting the completion reward. Finish Moon Castle for +500 once.

## Solid world

- Run and dash directly at tree trunks, stone pillars, castle walls and island cliffs. The pony must stop or slide along the surface, with no tunneling.
- Fly toward a tree crown and an island underside. They block movement. Fly above the tree or through an arch's open center to verify that empty space remains traversable.
- Check that no scenery obstructs a collectible or the safe spawn/runway. Rendering and physics share `SCENERY` and `SOLIDS`, so layout changes must update that shared source.
- Fall into the void or touch a guardian. Return to the most recent island without losing earned progress.

## Automated checks

Run `nx test studio --watch=false --browsers=ChromeHeadless --include='apps/studio/src/app/meadow/*.spec.ts'` and `nx build studio`.

The tests cover full quest traversal using continuous flight input, body-height pickup contact, duplicate-point prevention, reward persistence, solid movement/arch openings, camera collision, and projected character framing. Supplement these with real browser playtesting; the simulated flight controller is not a substitute for judging the feel of the game.
