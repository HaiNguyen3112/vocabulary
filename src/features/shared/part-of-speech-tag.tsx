import { Tag } from "antd";
import { PART_OF_SPEECH_LABEL, type PartOfSpeech } from "@shared/part-of-speech";
import { PART_OF_SPEECH_COLOR, PART_OF_SPEECH_NAME } from "@/constants/part-of-speech";

type Props = {
  partOfSpeech: PartOfSpeech;
  /** Short form ("Adj") for dense places like the table. */
  isCompact?: boolean;
};

export function PartOfSpeechTag({ partOfSpeech, isCompact = false }: Props) {
  return (
    <Tag color={PART_OF_SPEECH_COLOR[partOfSpeech]} bordered={false}>
      {isCompact ? PART_OF_SPEECH_LABEL[partOfSpeech] : PART_OF_SPEECH_NAME[partOfSpeech]}
    </Tag>
  );
}
