const typeToLabel = (type: number) => {
  switch (type) {
    case 128:
      return "Note Off";
    case 144:
      return "Note On";
    case 176:
      return "Control Change";
    case 192:
      return "Program Change";
    case 224:
      return "Pitch Bend";
    case 240:
      return "SysEx";
    default:
      return "Unknown";
  }
};

export { typeToLabel };
