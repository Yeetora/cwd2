package com.chaeuda.file;

import java.io.IOException;
import java.io.InputStream;

public interface ImageStorage {

    /**
     * 파일을 저장한다.
     *
     * @param input         파일 컨텐츠 스트림 (호출 후 닫힘)
     * @param originalName  사용자 업로드 원본 파일명
     * @param prefix        업로드 베이스 디렉터리 하위 경로 (예: "portfolios/12")
     * @return 저장 결과 (filePath는 베이스 디렉터리 기준 상대 경로)
     */
    StoredFile store(InputStream input, String originalName, String prefix) throws IOException;

    /** filePath는 store가 반환한 상대 경로. 존재하지 않더라도 예외를 던지지 않는다. */
    void delete(String filePath);

    /** 외부 노출용 URL 경로(예: /files/portfolios/12/abc.jpg). */
    String publicUrl(String filePath);
}
