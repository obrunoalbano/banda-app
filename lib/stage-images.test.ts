import { describe, expect, it } from "vitest";
import { imageHost, isAllowedImageHost, stageImagePaths } from "./stage-images";

describe("imagens de palco", () => {
  const team = ["pub-abc.r2.dev"];
  it("host e autorização", () => {
    expect(imageHost("https://PUB-ABC.r2.dev/x.jpg")).toBe("pub-abc.r2.dev");
    expect(imageHost("lixo")).toBeNull();
    expect(isAllowedImageHost("https://pub-abc.r2.dev/x.jpg", team)).toBe(true);
    expect(isAllowedImageHost("https://media-cdn.tripadvisor.com/x.jpg", team)).toBe(false);
    expect(isAllowedImageHost(null, team)).toBe(false);
  });
  it("caminhos seguros e com hash", () => {
    expect(stageImagePaths("cm1abc", "0123456789abcdef")).toEqual({
      cover: "stages/cm1abc/cover-0123456789.webp",
      thumb: "stages/cm1abc/thumb-0123456789.webp",
    });
    expect(stageImagePaths("../etc", "zz12ab").cover).toBe("stages/etc/cover-12ab.webp");
  });
});
