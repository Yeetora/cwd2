package com.chaeuda.inquiry.repository;

import com.chaeuda.inquiry.domain.Inquiry;
import com.chaeuda.inquiry.domain.InquiryStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class InquiryRepositoryTest {

    @Autowired
    private InquiryRepository inquiryRepository;

    @Test
    void prePersist_sets_status_NEW_and_createdAt() {
        Inquiry saved = inquiryRepository.save(Inquiry.builder()
                .name("홍길동")
                .phone("010-1234-5678")
                .content("문의합니다")
                .build());

        assertThat(saved.getStatus()).isEqualTo(InquiryStatus.NEW);
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    void list_all_ordered_by_createdAt_desc() throws InterruptedException {
        save("첫번째");
        Thread.sleep(5);
        save("두번째");
        Thread.sleep(5);
        save("세번째");

        Page<Inquiry> page = inquiryRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Inquiry::getName)
                .containsExactly("세번째", "두번째", "첫번째");
    }

    @Test
    void filter_by_status() {
        Inquiry n = save("새 문의");
        Inquiry c = save("확인됨");
        c.changeStatus(InquiryStatus.CHECKED);
        inquiryRepository.saveAndFlush(c);

        Page<Inquiry> news = inquiryRepository
                .findAllByStatusOrderByCreatedAtDesc(InquiryStatus.NEW, PageRequest.of(0, 10));
        Page<Inquiry> checks = inquiryRepository
                .findAllByStatusOrderByCreatedAtDesc(InquiryStatus.CHECKED, PageRequest.of(0, 10));

        assertThat(news.getContent()).extracting(Inquiry::getName).containsExactly("새 문의");
        assertThat(checks.getContent()).extracting(Inquiry::getName).containsExactly("확인됨");
    }

    @Test
    void countByStatus() {
        save("a");
        save("b");
        Inquiry done = save("c");
        done.changeStatus(InquiryStatus.DONE);
        inquiryRepository.saveAndFlush(done);

        assertThat(inquiryRepository.countByStatus(InquiryStatus.NEW)).isEqualTo(2);
        assertThat(inquiryRepository.countByStatus(InquiryStatus.DONE)).isEqualTo(1);
    }

    private Inquiry save(String name) {
        return inquiryRepository.save(Inquiry.builder()
                .name(name)
                .phone("010-0000-0000")
                .content("내용 " + name)
                .build());
    }
}
