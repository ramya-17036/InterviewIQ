package com.aiinterview.backend;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;
import java.io.FileInputStream;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void testPdfExtraction() throws Exception {
		File pdfFile = new File("test_resume.pdf");
		try (PDDocument document = new PDDocument()) {
			PDPage page = new PDPage();
			document.addPage(page);

			try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
				contentStream.beginText();
				contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
				contentStream.newLineAtOffset(100, 700);
				contentStream.showText("John Doe Resume");
				contentStream.endText();

				contentStream.beginText();
				contentStream.setFont(PDType1Font.HELVETICA, 10);
				contentStream.newLineAtOffset(100, 680);
				contentStream.showText("Skills: Java, Spring Boot, React, MySQL, Docker.");
				contentStream.endText();
			}
			document.save(pdfFile);
		}

		// Now read the PDF file back and extract text to verify
		try (FileInputStream fis = new FileInputStream(pdfFile);
			 PDDocument readDoc = PDDocument.load(fis)) {
			PDFTextStripper stripper = new PDFTextStripper();
			String text = stripper.getText(readDoc);
			System.out.println("Extracted PDF Text:\n" + text);
			assertTrue(text.contains("John Doe Resume"));
			assertTrue(text.contains("Skills: Java, Spring Boot, React, MySQL, Docker."));
		}
	}
}
