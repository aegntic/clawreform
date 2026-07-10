import { Composition } from "remotion";
import {
  ClawReformDemo,
  SiteFabricSequence,
  SiteMemorySequence,
} from "./SiteScrollSequence";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClawReformDemo"
        component={ClawReformDemo}
        durationInFrames={150}
        fps={30}
        width={960}
        height={540}
      />
      <Composition
        id="SiteFabricSequence"
        component={SiteFabricSequence}
        durationInFrames={150}
        fps={30}
        width={960}
        height={540}
      />
      <Composition
        id="SiteMemorySequence"
        component={SiteMemorySequence}
        durationInFrames={120}
        fps={30}
        width={960}
        height={540}
      />
    </>
  );
};
